import { useState, useCallback, useRef, useEffect } from 'react';
import { generateSpeech, transcribeAudio } from '../services/gemini';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');

  // Audio Playback refs
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Speech Recognition if available (as real-time preview augment)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization warning:', err);
      }
    }

    return () => {
      cleanupMedia();
      stopSpeaking();
    };
  }, []);

  const cleanupMedia = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setRecordingDuration(0);
  };

  const stopSpeaking = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // ignore
      }
      audioSourceRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      stopSpeaking();
      setIsSpeaking(true);

      const base64Audio = await generateSpeech(text);

      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = playbackContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      audioSourceRef.current = source;

      source.onended = () => {
        if (audioSourceRef.current === source) {
          setIsSpeaking(false);
          audioSourceRef.current = null;
        }
      };
      source.start();
    } catch (error) {
      console.warn("Gemini neural TTS fallback to native SpeechSynthesis:", error);
      setIsSpeaking(false);
      if (window.speechSynthesis) {
        const uttr = new SpeechSynthesisUtterance(text);
        uttr.onend = () => setIsSpeaking(false);
        uttr.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(uttr);
      }
    }
  }, [stopSpeaking]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setVoiceError(null);
      stopSpeaking();
      cleanupMedia();
      liveTranscriptRef.current = '';
      setInterimTranscript('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup Web Audio Analyser for volume visualization
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const sourceNode = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        sourceNode.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to 0 - 100
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);
          animFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      } catch (err) {
        console.warn("Audio analyser setup error:", err);
      }

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Slice chunks every 250ms

      // Start Web Speech recognition for live preview if supported
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            if (finalTranscript) {
              liveTranscriptRef.current = (liveTranscriptRef.current + ' ' + finalTranscript).trim();
            }
            setInterimTranscript(interim || liveTranscriptRef.current);
          };

          recognitionRef.current.onerror = (e: any) => {
            console.warn('SpeechRecognition interim error:', e?.error);
          };

          recognitionRef.current.start();
        } catch (e) {
          console.warn('Could not start interim speech recognition:', e);
        }
      }

      // Timer for recording duration
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
      return true;
    } catch (err: any) {
      console.error("Failed to start voice recording:", err);
      const errorMsg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone permission denied. Please grant microphone access to speak.'
        : err.message || 'Could not access microphone.';
      setVoiceError(errorMsg);
      cleanupMedia();
      setIsRecording(false);
      return false;
    }
  }, [stopSpeaking]);

  const stopRecording = useCallback(async (
    onResult?: (text: string) => void
  ): Promise<string> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        setIsRecording(false);
        resolve('');
        return;
      }

      setIsRecording(false);
      setIsTranscribing(true);

      const mediaRecorder = mediaRecorderRef.current;
      const stream = streamRef.current;
      const mimeType = mediaRecorder.mimeType || 'audio/webm';

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          cleanupMedia();

          let transcribedText = '';

          // If speech recognition already captured reliable text and audio was very short:
          const interimResult = (liveTranscriptRef.current || interimTranscript).trim();

          // Transcribe via Gemini Audio Multimodal API for supreme precision & term accuracy
          if (audioBlob.size > 2000) {
            try {
              const base64Data = await new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  res(result);
                };
                reader.onerror = rej;
                reader.readAsDataURL(audioBlob);
              });

              transcribedText = await transcribeAudio(base64Data, mimeType);
            } catch (transcribeErr) {
              console.warn("Gemini audio transcription fallback to speech recognition text:", transcribeErr);
              transcribedText = interimResult;
            }
          } else {
            transcribedText = interimResult;
          }

          const finalText = (transcribedText || interimResult).trim();
          setIsTranscribing(false);
          setInterimTranscript('');

          if (onResult && finalText) {
            onResult(finalText);
          }

          resolve(finalText);
        } catch (err: any) {
          console.error("Error finalizing audio recording:", err);
          setVoiceError("Failed to transcribe audio.");
          setIsTranscribing(false);
          cleanupMedia();
          resolve('');
        }
      };

      try {
        mediaRecorder.stop();
      } catch (e) {
        cleanupMedia();
        setIsTranscribing(false);
        resolve('');
      }
    });
  }, [isRecording, interimTranscript]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    cleanupMedia();
    setIsRecording(false);
    setIsTranscribing(false);
    setInterimTranscript('');
    setVoiceError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    isSpeaking,
    recordingDuration,
    audioLevel,
    interimTranscript,
    voiceError,
    setVoiceError,
    startRecording,
    stopRecording,
    cancelRecording,
    speak,
    stopSpeaking,
  };
}
