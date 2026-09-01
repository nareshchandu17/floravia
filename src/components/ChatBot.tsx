import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  Loader2, 
  MessageSquare, 
  Camera, 
  X, 
  Cpu, 
  Cloud, 
  Sprout, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  Radio,
  FileText,
  Sparkles,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useChatBot } from '../hooks/useChatBot';
import { useVoice } from '../hooks/useVoice';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'verify-email'>('verify-email');
  const {
    messages,
    input,
    setInput,
    selectedImage,
    setSelectedImage,
    isLoading,
    isHistoryLoading,
    threads,
    currentThreadId,
    error,
    handleSend,
    handleRetry,
    createNewChat,
    switchThread,
    deleteThread,
    deleteMessage,
    setMessageFeedback
  } = useChatBot();
  
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const {
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
    stopSpeaking
  } = useVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (voiceEnabled && messages.length === 1 && messages[0].role === 'model') {
      speak("System online. Voice Gardener protocols initialized. I am Sage. How can I assist with your botanical sanctuary today?");
    }
  }, [voiceEnabled]);

  const lastSpokenRef = useRef<string | null>(null);

  // Auto-speak model responses if voice mode is enabled
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (voiceEnabled && lastMessage?.role === 'model' && !isLoading && lastMessage.text && lastMessage.text !== lastSpokenRef.current) {
      lastSpokenRef.current = lastMessage.text;
      const timeout = setTimeout(() => {
        speak(lastMessage.text);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [messages, voiceEnabled, isLoading, speak]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicClick = async () => {
    if (isRecording) {
      handleStopAndSend();
    } else {
      setVoiceError(null);
      if (!voiceEnabled) setVoiceEnabled(true);
      await startRecording();
    }
  };

  const handleStopAndSend = async () => {
    const text = await stopRecording();
    if (text && text.trim()) {
      handleSend(text.trim(), true);
    } else if (input.trim()) {
      handleSend(input.trim(), true);
    }
  };

  const handleStopAndInsert = async () => {
    const text = await stopRecording();
    if (text && text.trim()) {
      setInput((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Image must be smaller than 4MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getThreadIcon = (title: string, snippet?: string) => {
    const combined = (title + ' ' + (snippet || '')).toLowerCase();
    if (combined.includes('propagat') || combined.includes('grow') || combined.includes('seed')) return <Sprout className="w-4 h-4" />;
    if (combined.includes('disease') || combined.includes('dying') || combined.includes('sick') || combined.includes('pest')) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (combined.includes('water') || combined.includes('humid') || combined.includes('rain')) return <Cloud className="w-4 h-4 text-blue-400" />;
    if (combined.includes('diagnos') || combined.includes('scan') || combined.includes('analyze')) return <Cpu className="w-4 h-4 text-purple-400" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-80px)] bg-void overflow-hidden border border-white/5 rounded-3xl">
      {/* Sidebar - Historical Continuums */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-surface border-r border-white/5 flex flex-col overflow-hidden"
          >
            {/* New Chat Button */}
            <div className="p-4">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(52, 211, 153, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={createNewChat}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-green-500/20 text-green-400 text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.05)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Garden Session
              </motion.button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Historical Continuums</span>
                {isHistoryLoading && <Loader2 className="w-3 h-3 text-green-400 animate-spin" />}
              </div>
              {threads.map((thread) => (
                <div key={thread.id} className="group relative">
                  <button
                    onClick={() => switchThread(thread.id!)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all cursor-pointer ${
                      currentThreadId === thread.id 
                        ? 'bg-white/5 border border-white/10 shadow-inner' 
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${currentThreadId === thread.id ? 'text-green-400' : 'text-muted'}`}>
                      {getThreadIcon(thread.title, thread.snippet)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs font-bold truncate mb-0.5 ${currentThreadId === thread.id ? 'text-primary' : 'text-secondary font-medium'}`}>
                        {thread.title}
                      </p>
                      {thread.snippet && (
                        <p className="text-[10px] text-muted truncate opacity-50 font-medium">
                          {thread.snippet}
                        </p>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setThreadToDelete(thread.id!);
                      setShowDeleteModal(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-void/50 rounded-lg backdrop-blur-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/5 bg-void/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <User className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary truncate">{user.displayName || user.email}</p>
                  <p className="text-[10px] text-muted truncate">Master Gardener</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-void/50">
        {/* Chat Header */}
        <header className="h-14 px-4 border-b border-white/5 flex items-center justify-between bg-surface/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-muted transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-400 shadow-glow-green" />
              <h2 className="text-sm font-bold text-primary tracking-tight">Sage Intelligence Core</h2>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Recording Active Status in Header */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/15 border border-red-500/40 rounded-full"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                    Recording {formatDuration(recordingDuration)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speaking / Audio Playing Status */}
            {isSpeaking && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={stopSpeaking}
                className="flex items-center gap-2 px-3 py-1 bg-green-500/15 border border-green-500/40 rounded-full text-green-400 text-xs font-semibold hover:bg-green-500/25 transition-colors cursor-pointer"
                title="Stop Sage Audio"
              >
                <Square className="w-3 h-3 fill-green-400" />
                <span className="text-[10px] font-bold">Stop Voice</span>
              </motion.button>
            )}

            {/* Voice Mode Toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                voiceEnabled 
                  ? 'text-green-400 bg-green-400/15 border border-green-400/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]' 
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`}
              title={voiceEnabled ? 'Voice Output Active (Sage speaks responses)' : 'Enable Sage Voice Output'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-10">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                  msg.role === 'user' 
                  ? 'bg-primary text-void shadow-glow-white border border-white/20' 
                  : 'bg-surface border border-white/10'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 md:w-6 md:h-6" /> : <Bot className="w-5 h-5 md:w-6 md:h-6 text-green-400" />}
                </div>
                
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block w-full text-left`}>
                    {msg.image && (
                      <div className="mb-4 rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 bg-surface max-w-sm ml-auto mr-0 md:mr-auto">
                        <img src={msg.image} alt="User shared" className="w-full h-auto max-h-[300px] object-cover" />
                      </div>
                    )}
                    {msg.role === 'model' && (msg.text.toLowerCase().includes('i see') || msg.text.toLowerCase().includes('previously') || msg.text.toLowerCase().includes('last week') || msg.text.toLowerCase().includes('recorded') || msg.text.toLowerCase().includes('trend')) && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 w-fit">
                        <Cpu className="w-3 h-3 text-green-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-green-400">Botanical Memory Engaged</span>
                      </div>
                    )}
                    
                    {msg.role === 'model' && (msg.text.toLowerCase().includes('projection') || msg.text.toLowerCase().includes('forecast') || msg.text.toLowerCase().includes('risk') || msg.text.toLowerCase().includes('likely') || msg.text.toLowerCase().includes('predict')) && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
                        <Cloud className="w-3 h-3 text-blue-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Predictive Intelligence Active</span>
                      </div>
                    )}

                    {msg.role === 'model' && msg.image && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 w-fit">
                        <Camera className="w-3 h-3 text-purple-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">Deep Tissue Scan Complete</span>
                      </div>
                    )}
                    <div className={`markdown-body max-w-none prose prose-invert prose-emerald prose-sm ${msg.role === 'user' ? 'prose-headings:text-white text-white p-4 bg-surface/30 rounded-2xl border border-white/5' : 'text-primary/90 p-5 bg-white/[0.02] rounded-2xl border border-white/5 shadow-sm'}`}>
                      <Markdown components={msg.role === 'model' ? {
                        strong: ({ children }) => {
                          const colors = [
                            'text-blue-400 bg-blue-400/5 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
                            'text-green-400 bg-green-400/5 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
                            'text-yellow-400 bg-yellow-400/5 border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]',
                            'text-purple-400 bg-purple-400/5 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
                            'text-pink-400 bg-pink-400/5 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                          ];
                          const colorIndex = (typeof children === 'string' ? children.length : 0) % colors.length;
                          return (
                            <span className={`inline-block px-2.5 py-1 my-1 mx-0.5 rounded-lg border font-black uppercase tracking-wider text-[11px] backdrop-blur-md ${colors[colorIndex]}`}>
                              {children}
                            </span>
                          );
                        }
                      } : undefined}>
                        {msg.text}
                      </Markdown>
                    </div>

                    {msg.role === 'model' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-muted">
                        <button
                          onClick={() => handleCopy(msg.text, idx.toString())}
                          className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === idx.toString() ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => speak(msg.text)}
                          className="p-1.5 hover:text-green-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const targetId = msg.id || idx.toString();
                            setMessageFeedback(targetId, msg.feedback === 'like' ? null : 'like');
                          }}
                          className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${msg.feedback === 'like' ? 'text-green-400' : 'hover:text-white'}`}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const targetId = msg.id || idx.toString();
                            setMessageFeedback(targetId, msg.feedback === 'dislike' ? null : 'dislike');
                          }}
                          className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${msg.feedback === 'dislike' ? 'text-red-400' : 'hover:text-white'}`}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 md:gap-6"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-surface border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 md:w-6 md:h-6 text-green-400 animate-pulse" />
                </div>
                <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                  <span className="text-xs text-muted font-mono">Synthesizing botanical diagnosis...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(!user || !user.emailVerified) && (
                    <button
                      onClick={() => {
                        setAuthModalMode(user ? 'verify-email' : 'login');
                        setAuthModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {user ? 'Verify Email' : 'Sign In'}
                    </button>
                  )}
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input & Voice Recording Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-void via-void to-transparent">
          <div className="max-w-3xl mx-auto space-y-3 relative">
            {/* Voice Permission/Error Toast */}
            {voiceError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center justify-between gap-3 text-red-300 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{voiceError}</span>
                </div>
                <button 
                  onClick={() => setVoiceError(null)}
                  className="p-1 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Transcribing Status Card */}
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-[#0d2117] border border-green-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-green-400" />
                      Transcribing Voice with Gemini Audio AI...
                    </p>
                    <p className="text-[11px] text-green-300/70">
                      Parsing botanical terms, species names, and question semantics
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Selected Image Thumbnail Preview */}
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 bg-surface border border-white/10 rounded-2xl flex items-center gap-3 w-fit group"
              >
                <img src={selectedImage} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-white/5" />
                <div className="text-xs">
                  <p className="text-primary font-bold">Attached Leaf Image</p>
                  <p className="text-[10px] text-muted">Ready for botanical analysis</p>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-muted hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ACTIVE AUDIO RECORDING BAR */}
            {isRecording ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 md:p-4 bg-surface/90 border border-green-500/50 rounded-2xl md:rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden"
              >
                {/* Background Ambient Pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-green-500/10 to-red-500/5 pointer-events-none" />

                {/* Left: Recording Indicator & Duration */}
                <div className="flex items-center gap-3 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-mono font-bold tracking-wider">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>

                  {/* Dynamic Audio Level Waveform Bars */}
                  <div className="flex items-center gap-1 h-6 px-2">
                    {[0.6, 1.2, 0.8, 1.5, 2.0, 1.4, 0.9, 1.7, 1.1, 0.7].map((factor, i) => {
                      const dynamicHeight = Math.max(6, Math.min(24, (audioLevel / 4) * factor + Math.random() * 4));
                      return (
                        <motion.div
                          key={i}
                          animate={{ height: dynamicHeight }}
                          transition={{ duration: 0.1 }}
                          className="w-1 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Center: Live Transcript Preview */}
                <div className="flex-1 min-w-0 px-2 z-10">
                  <p className="text-xs text-green-300 italic truncate">
                    {interimTranscript ? `"${interimTranscript}"` : "Listening... Speak your plant care question now"}
                  </p>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 z-10 self-end md:self-auto">
                  {/* Cancel Recording */}
                  <button
                    onClick={handleCancelRecording}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-muted hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
                    title="Cancel recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Stop & Insert Text into Input */}
                  <button
                    onClick={handleStopAndInsert}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/10 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Stop & Edit question in input box"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Text</span>
                  </button>

                  {/* Stop & Send to Sage */}
                  <button
                    onClick={handleStopAndSend}
                    className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] cursor-pointer"
                    title="Send Spoken Question to Sage"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Query</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* STANDARD INPUT BAR (With Mic Audio Button) */
              <div className="flex items-center gap-2 md:gap-3 p-2 bg-surface/80 backdrop-blur-xl border border-white/10 focus-within:border-green-500/40 rounded-2xl md:rounded-3xl shadow-2xl transition-all">
                {/* Image Upload Button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl transition-all cursor-pointer ${
                    selectedImage ? 'text-green-400 bg-green-400/15 border border-green-400/30' : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                  title="Upload Plant Image for Diagnostic"
                >
                  <ImageIcon className="w-5 h-5" />
                </motion.button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {/* MICROPHONE AUDIO RECORDING BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMicClick}
                  className="p-3 md:p-3.5 rounded-xl md:rounded-2xl text-green-400 hover:bg-green-500/15 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer relative shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                  title="Ask via Voice (Microphone Audio Recording)"
                >
                  <Mic className="w-5 h-5" />
                </motion.button>
                
                {/* Text Message Input */}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={selectedImage ? "Add questions about this image or press Enter..." : "Ask Sage a plant question or tap mic to speak..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-3 placeholder:text-muted/50 text-sm md:text-base outline-none text-primary"
                />
                
                {/* Send Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                  className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    (input.trim() || selectedImage) && !isLoading 
                    ? 'bg-green-500 hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] font-bold' 
                    : 'bg-white/5 text-muted cursor-not-allowed opacity-40'
                  }`}
                  title="Send Message"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-card p-6 border-red-500/20"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-primary">Purge Conversation?</h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    This action will permanently delete all memory fragments associated with this botanical continuum. This cannot be reversed.
                  </p>
                </div>

                <div className="flex flex-col w-full gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (threadToDelete) {
                        await deleteThread(threadToDelete);
                        setShowDeleteModal(false);
                        setThreadToDelete(null);
                      }
                    }}
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-3 bg-surface text-secondary rounded-xl font-bold hover:text-primary transition-colors border border-white/5 cursor-pointer"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};
