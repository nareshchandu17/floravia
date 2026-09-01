import { useState, useEffect, useCallback, useRef } from 'react';
import { chatWithGardeningExpert, generateThreadTitle } from '../services/gemini';
import { 
  getUserPlants, 
  getPlantHealthHistory,
  getCareLogs,
  getPlantReminders,
  getUserFeedback, 
  getUserPreferences,
  saveChatMessage, 
  getChatHistory,
  getUserThreads,
  createChatThread,
  deleteChatThread,
  updateChatThread,
  deleteMessagePair,
  updateMessageFeedback,
  ChatThread,
  parseFirestoreError
} from '../services/firebase';
import { getCurrentWeather, getWeatherForecast } from '../services/weather';
import { useAuth } from './useAuth';

export interface Message {
  id?: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  feedback?: 'like' | 'dislike' | null;
}

export function useChatBot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Systems initialized. I am **Sage, your botanical intelligence core**. How shall we safeguard your sanctuary today?" }
  ]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{ text: string, image?: string | null, isVoice: boolean } | null>(null);
  const [contextStack, setContextStack] = useState<string>('');
  const [weatherContext, setWeatherContext] = useState<string>('');

  // Fetch Threads
  const fetchThreads = useCallback(async () => {
    if (!user) return;
    try {
      const allThreads = await getUserThreads();
      setThreads(allThreads);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch History for current thread
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || isLoading) return; // Don't fetch if currently sending
      setIsHistoryLoading(true);
      try {
        const history = await getChatHistory(currentThreadId || undefined, 50);
        if (history.length > 0) {
          setMessages(history);
        } else if (!currentThreadId) {
          setMessages([
            { role: 'model', text: "Systems initialized. I am **Sage, your botanical intelligence core**. How shall we safeguard your sanctuary today?" }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [user, currentThreadId, isLoading]);

  const [isRefreshingContext, setIsRefreshingContext] = useState(false);

  // 2. Build Botanical Context Stack
  const fetchContextStack = useCallback(async () => {
      if (!user) return;
      setIsRefreshingContext(true);
      try {
        const [plants, feedback, prefs, threads] = await Promise.all([
          getUserPlants().catch(() => []),
          getUserFeedback().catch(() => []),
          getUserPreferences().catch(() => null),
          getUserThreads().catch(() => [])
        ]);

        if (plants.length === 0 && threads.length === 0) {
          setContextStack("USER_STATUS: NEW_GARDENER\nINVENTORY: EMPTY\nSTRATEGY: Onboarding/Guidance");
          return;
        }

        let stack = "GARDEN_SYSTEM_INVENTORY:\n";
        
        const plantData = await Promise.all(plants.map(async (p) => {
          if (!p.id) return "";
          
          const [history, logs, reminders] = await Promise.all([
            getPlantHealthHistory(p.id).catch(() => []),
            getCareLogs(p.id).catch(() => []),
            getPlantReminders(p.id).catch(() => [])
          ]);

          const recentHistory = history.slice(-10).map(h => {
             const date = new Date(h.createdAt?.toDate?.() || h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
             return `- [${date}]: Vigor ${h.healthScore}% (${h.mood})${h.note ? ` Observation: ${h.note}` : ''}`;
          }).join('\n');

          const recentLogs = logs.slice(0, 7).map(l => {
             const date = new Date(l.createdAt?.toDate?.() || l.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
             return `- [${date}]: Care Record: ${l.type.toUpperCase()}`;
          }).join('\n');

          const upcomingReminders = reminders
            .filter(r => !r.notified)
            .slice(0, 3)
            .map(r => `- [${new Date(r.dueDate?.toDate?.() || r.dueDate).toLocaleDateString()}]: ${r.type.toUpperCase()}`)
            .join('\n');

          // Calculate trend
          let trend = "STABLE";
          if (history.length >= 2) {
            const last = history[history.length - 1].healthScore;
            const prev = history[history.length - 2].healthScore;
            if (last > prev + 5) trend = "RECOVERING/IMPROVING";
            else if (last < prev - 5) trend = "DECLINING/STRUGGLING";
          }

          return `ENTITY_PROFILE: ${p.nickname || p.name} (${p.scientificName})
  - CURRENT_VITALITY: ${p.healthScore}% (${p.mood})
  - RECENT_TREND: ${trend}
  - BIOMETRIC_HISTORY (Chronological):
${recentHistory || "    No biometric history found."}
  - INTERVENTION_LOGS (Reverse Chronological):
${recentLogs || "    No recent care recorded."}
  - UPCOMING_CARE_TASKS:
${upcomingReminders || "    No pending tasks."}`;
        }));

        stack += plantData.filter(d => d !== "").join('\n\n');
        
        // 3. Historical Interaction Memory (Threads)
        const threadSummary = threads
          .filter(t => t.id !== currentThreadId) // Exclude current
          .slice(0, 5)
          .map(t => `- [${new Date(t.updatedAt?.toDate?.() || t.updatedAt).toLocaleDateString()}]: "${t.title}" ${t.snippet ? `(${t.snippet})` : ''}`)
          .join('\n');

        stack += `\n\nLONGITUDINAL_CHAT_MEMORY:
  - RECENT_TOPICS:
${threadSummary || "    No previous botanical continuums found."}
  - MEMORY_DEPTH: ${threads.length} threads archived`;

        // Elite Preference Memory
        if (prefs) {
          stack += `\n\nUSER_ELITE_PROFILE:
  - EXPERTISE: ${prefs.expertise || 'Intermediate'}
  - STYLE: ${prefs.gardeningStyle || 'Sustainable'}
  - INTERESTS: ${prefs.specialInterests?.join(', ') || 'General Botany'}
  - PREFERRED_TONE: ${prefs.sageTone || 'Elite/Clinical'}`;
        }
        
        const recentFeedback = feedback.slice(0, 5).map(f => 
          `- [${f.analysisType.toUpperCase()}]: ${f.isPositive ? 'Satisfactory' : 'Anomalous/Needs Adjustment'}`
        ).join('\n');

        stack += `\n\nSYSTEM_EXPERIENCE_LOGS:
${recentFeedback || "No historical experience recorded yet."}`;
        
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'long' });
        const season = ['December', 'January', 'February'].includes(month) ? 'Winter' :
                       ['March', 'April', 'May'].includes(month) ? 'Spring' :
                       ['June', 'July', 'August'].includes(month) ? 'Summer' : 'Autumn';
        
        stack += `\n\nSPATIOTEMPORAL_DATA:
- DATE: ${now.toLocaleDateString()}
- SEASONAL_CYCLE: ${season} (${month})
- GROWTH_VELOCITY: ${season === 'Winter' ? 'STAGNANT/DORMANT' : 'ACCELERATED'}`;

        setContextStack(stack);
      } catch (err) {
        console.error("Context Stack Failure:", err);
      } finally {
        setIsRefreshingContext(false);
      }
  }, [user]);

  useEffect(() => {
    fetchContextStack();
  }, [fetchContextStack]);

  // 3. Atmosphere Context
  useEffect(() => {
    const fetchLocalAtmosphere = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const [weather, forecast] = await Promise.all([
            getCurrentWeather(latitude, longitude),
            getWeatherForecast(latitude, longitude)
          ]);

          setWeatherContext(`LOCAL ATMOSPHERE (CURRENT):
- Location: ${weather.city}
- Temp: ${weather.temp}°C
- Humidity: ${weather.humidity}%
- Conditions: ${weather.condition}

${forecast}

ELITE_DIRECTIVE: Use these 3-day projections to anticipate "Fungal Thresholds" or "Turgor Stress" before symptoms manifest.`);
        } catch (err) {
          console.error("Failed to sync weather for Sage:", err);
        }
      });
    };
    fetchLocalAtmosphere();
  }, []);

  const handleSend = useCallback(async (overrideText?: string, isVoice: boolean = false) => {
    const messageText = overrideText || input.trim();
    if ((!messageText && !selectedImage) || isLoading) return;

    const userMessage = messageText;
    const userImage = selectedImage;
    
    let threadId = currentThreadId;
    
    setInput('');
    setSelectedImage(null);
    setError(null);
    setLastRequest({ text: userMessage, image: userImage, isVoice });
    setMessages(prev => [...prev, { role: 'user', text: userMessage, image: userImage || undefined }]);
    setIsLoading(true);

    try {
      // 1. Ensure thread exists
      if (!threadId) {
        const initialTitle = userMessage.slice(0, 30) || "Botanical Scan";
        threadId = await createChatThread(initialTitle);
        setCurrentThreadId(threadId);
        fetchThreads();
        
        // Background title generation for refined semantics
        generateThreadTitle(userMessage, userImage || undefined).then(refinedTitle => {
          if (threadId) {
            updateChatThread(threadId, { title: refinedTitle }).then(() => {
              fetchThreads();
            });
          }
        }).catch(err => console.error("Title refinement failed:", err));
      }

      await fetchContextStack(); // Ensure context is fresh before sending
      
      const userMsgId = await saveChatMessage(userMessage, 'user', userImage || undefined, threadId);
      if (userMsgId) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastUserIndex = [...newMessages].reverse().findIndex(m => m.role === 'user');
          if (lastUserIndex !== -1) {
            const actualIndex = newMessages.length - 1 - lastUserIndex;
            newMessages[actualIndex] = { ...newMessages[actualIndex], id: userMsgId };
          }
          return newMessages;
        });
      }
      fetchThreads();

      const history = messages.map(msg => {
        const parts: any[] = [{ text: msg.text }];
        if (msg.image) {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: msg.image.split(",")[1] || msg.image,
            },
          });
        }
        return {
          role: msg.role,
          parts
        };
      });
      
      const fullContext = `${contextStack}\n\n${weatherContext}`.trim();
      const streamingResponse = await chatWithGardeningExpert(userMessage, history, fullContext, userImage || undefined, isVoice);
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      let botText = '';
      for await (const chunk of streamingResponse) {
        const chunkText = chunk.text;
        botText += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: botText };
          return newMessages;
        });
      }

      const botMsgId = await saveChatMessage(botText, 'model', undefined, threadId);
      if (botMsgId) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], id: botMsgId };
          return newMessages;
        });
      }
      fetchThreads();
    } catch (error: any) {
      console.error('Chat error:', error);
      const parsed = parseFirestoreError(error);
      if (parsed.isPermissionError || parsed.isUnverifiedEmail) {
        setError(parsed.userMessage);
      } else {
        setError(error?.message || "I'm having trouble connecting to Sage. My systems may be undergoing maintenance or experiencing a network fluctuation.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, input, selectedImage, isLoading, contextStack, weatherContext, currentThreadId, fetchThreads, fetchContextStack]);

  const createNewChat = useCallback(() => {
    setCurrentThreadId(null);
    setError(null);
    setMessages([{ role: 'model', text: "New botanical continuum initiated. Sage is **ready to analyze your sanctuary**. How shall we proceed?" }]);
  }, []);

  const handleRetry = useCallback(() => {
    if (lastRequest) {
      // Remove the last model error message if it was added (though in new logic we show error separately)
      // Actually, we don't add the error message to messages anymore, so just re-run
      handleSend(lastRequest.text, lastRequest.isVoice);
    }
  }, [lastRequest, handleSend]);

  const switchThread = useCallback((id: string) => {
    setCurrentThreadId(id);
  }, []);

  const deleteThread = useCallback(async (id: string) => {
    try {
      await deleteChatThread(id);
      if (currentThreadId === id) {
        createNewChat();
      }
      fetchThreads();
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  }, [currentThreadId, createNewChat, fetchThreads]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentThreadId) return;
    try {
      await deleteMessagePair(currentThreadId, messageId);
      // Refresh messages
      const history = await getChatHistory(currentThreadId, 50);
      setMessages(history.length > 0 ? history : [
        { role: 'model', text: "Systems initialized. I am **Sage, your botanical intelligence core**. How shall we safeguard your sanctuary today?" }
      ]);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }, [currentThreadId]);

  const setMessageFeedback = useCallback(async (messageId: string, feedback: 'like' | 'dislike' | null) => {
    try {
      await updateMessageFeedback(messageId, feedback);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));
    } catch (err) {
      console.error("Failed to set feedback:", err);
    }
  }, []);

  return {
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
  };
}
