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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useChatBot } from '../hooks/useChatBot';
import { useVoice } from '../hooks/useVoice';
import { useAuth } from '../hooks/useAuth';

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
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

  const { isListening, isSpeaking, interimTranscript, listen, stopListening, speak } = useVoice();
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!voiceEnabled) setVoiceEnabled(true);
      listen((text) => {
        handleSend(text, true);
      });
    }
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
      {/* Sidebar - ChatGPT Style */}
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-green-500/20 text-green-400 text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.05)]"
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
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all ${
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
              className="p-2 hover:bg-white/5 rounded-lg text-muted transition-colors"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-400 shadow-glow-green" />
              <h2 className="text-sm font-bold text-primary tracking-tight">Sage Intelligence Core</h2>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
                  />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-green-400">Audio Stream Active</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-all ${voiceEnabled ? 'text-green-400 bg-green-400/10' : 'text-muted hover:text-white'}`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Messages */}
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
                            'text-cyan-400 bg-cyan-400/5 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                          ];
                          const colorClass = colors[idx % colors.length];
                          return (
                            <motion.span 
                              initial={{ opacity: 0.8 }}
                              whileHover={{ scale: 1.02, opacity: 1 }}
                              className={`font-black tracking-tight px-2 py-0.5 rounded-md border ${colorClass} transition-all duration-300 inline-block cursor-default`}
                            >
                              {children}
                            </motion.span>
                          );
                        }
                      } : {}}>
                        {msg.text}
                      </Markdown>

                      {msg.role === 'model' && msg.id && (
                        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-white/5">
                          <button 
                            onClick={() => handleCopy(msg.text, msg.id!)}
                            title="Copy response"
                            className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-primary transition-all flex items-center gap-1.5"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Copy</span>
                          </button>
                          
                          <div className="h-3 w-px bg-white/10 mx-1" />

                          <button 
                            onClick={() => setMessageFeedback(msg.id!, msg.feedback === 'like' ? null : 'like')}
                            title="Satisfactory assessment"
                            className={`p-1.5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 ${msg.feedback === 'like' ? 'text-green-400 bg-green-400/10' : 'text-muted hover:text-green-400'}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => setMessageFeedback(msg.id!, msg.feedback === 'dislike' ? null : 'dislike')}
                            title="Anomalous behavior"
                            className={`p-1.5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 ${msg.feedback === 'dislike' ? 'text-red-400 bg-red-400/10' : 'text-muted hover:text-red-400'}`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex-1" />

                          <button 
                            onClick={() => deleteMessage(msg.id!)}
                            title="Purge message pair"
                            className="p-1.5 hover:bg-red-400/10 rounded-lg text-muted hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (messages[messages.length - 1]?.role !== 'model' || !messages[messages.length - 1]?.text) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 py-2"
              >
                <div className="flex items-center gap-1.5 ml-14">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full shadow-glow-green"
                  />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400/60">Synchronizing botanical data...</span>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-red-950/20 border border-red-500/20 backdrop-blur-sm"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-red-400 font-bold uppercase tracking-widest text-[10px]">Communication Interrupted</p>
                  <p className="text-sm text-secondary leading-relaxed max-w-sm mx-auto">
                    {error}
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95"
                >
                  <Loader2 className="w-4 h-4" />
                  Relaunch Neural Sync
                </button>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-void via-void to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {isListening && (
              <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-3">
                <div className="flex items-end gap-1.5 h-8">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: isListening ? [8, 32, 12, 28, 8] : 8,
                        backgroundColor: isListening ? ['#4ade80', '#22c55e', '#4ade80'] : '#4ade80'
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity, 
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                      className="w-1.5 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                  {interimTranscript ? "Decoding..." : "Sage Listening..."}
                </span>
                {interimTranscript && (
                  <span className="text-xs text-white/40 italic truncate max-w-[200px]">"{interimTranscript}"</span>
                )}
              </div>
            )}

            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-24 left-0 p-2 bg-surface border border-white/10 rounded-2xl flex items-center gap-3 group"
              >
                <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-white/5" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            <div className={`flex items-center gap-3 p-2 bg-surface/80 backdrop-blur-xl border rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-700 relative overflow-hidden ${
              isListening 
                ? 'border-green-400/60 shadow-[0_0_60px_rgba(34,197,94,0.3)] bg-green-950/20 ring-4 ring-green-500/10 scale-[1.02]' 
                : 'border-white/10 focus-within:border-green-500/30'
            }`}>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 pointer-events-none"
                  transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                />
              )}
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${selectedImage ? 'text-green-400 bg-green-400/10' : 'text-muted hover:text-white'}`}
              >
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
              </motion.button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                animate={isListening ? { scale: [1, 1.1, 1], backgroundColor: ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.2)'] } : {}}
                transition={isListening ? { repeat: Infinity, duration: 2 } : {}}
                onClick={handleVoiceInput}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all relative group/mic ${isListening ? 'text-green-400 bg-green-400/20 shadow-glow-green' : 'text-muted hover:text-white'}`}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-green-400 rounded-xl md:rounded-2xl blur-lg"
                  />
                ) : null}
                {isListening ? <MicOff className="w-5 h-5 md:w-6 md:h-6 relative z-10" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </motion.button>
              
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening to your wisdom..." : selectedImage ? "Analyzing visual data..." : "Ask Sage about your botanical sanctuary..."}
                className={`flex-1 bg-transparent border-none focus:ring-0 px-2 py-3 placeholder:text-muted/40 text-base md:text-lg outline-none transition-colors ${isListening ? 'text-green-400' : 'text-primary'}`}
              />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
                  (input.trim() || selectedImage) && !isLoading 
                  ? 'bg-primary text-void shadow-glow-white active:scale-95' 
                  : 'bg-surface text-muted cursor-not-allowed grayscale'
                }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
              </motion.button>
            </div>
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
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                  >
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-3 bg-surface text-secondary rounded-xl font-bold hover:text-primary transition-colors border border-white/5"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

