import React, { useState, useEffect, useRef, useCallback } from 'react';
// Официальный ESM-модуль @google/genai (в браузере доступен из 'https://esm.run/@google/genai')
import { GoogleGenAI } from '@google/genai';
import { Header } from './components/Header';
import { AvatarStage } from './components/AvatarStage';
import { ChatFeed } from './components/ChatFeed';
import { ChatInput } from './components/ChatInput';
import { LiveVoiceStage } from './components/LiveVoiceStage';
import { MemoryVaultModal } from './components/MemoryVaultModal';
import { CompanionSettingsModal } from './components/CompanionSettingsModal';
import { DeepTopicsDrawer } from './components/DeepTopicsDrawer';
import { MicrophonePermissionModal } from './components/MicrophonePermissionModal';
import { AvatarSelectModal } from './components/AvatarSelectModal';
import { RelationshipSummaryModal } from './components/RelationshipSummaryModal';
import { ChatWallpaperModal } from './components/ChatWallpaperModal';
import { ImageGeneratorModal } from './components/ImageGeneratorModal';
import { Footer } from './components/Footer';
import { GoogleAdBanner } from './components/GoogleAdBanner';
import { getDeviceFormattedTime } from './utils/timeHelper';
import { StorageService, getStageTitle, DEFAULT_AVATAR, DEFAULT_WALLPAPER } from './services/storage';
import { SpeechService, VoiceRecognitionService, VoiceSessionStatus } from './services/speech';
import {
  AmbientLighting,
  EmotionType,
  MemoryFact,
  Message,
  CompanionProfile,
  RelationshipState,
  RelationshipSummary,
  ConversationMode,
  ChatWallpaper,
} from './types';
import { Sparkles, MessageCircle, User } from 'lucide-react';

// Инициализация GoogleGenAI через переменную окружения Netlify / Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: apiKey });

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => StorageService.getMessages());
  const [profile, setProfile] = useState<CompanionProfile>(() => StorageService.getProfile());
  const [memories, setMemories] = useState<MemoryFact[]>(() => StorageService.getMemories());
  const [relationship, setRelationship] = useState<RelationshipState>(() => StorageService.getRelationship());
  
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('calm');
  const [ambient, setAmbient] = useState<AmbientLighting>('cozy_evening');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  // Conversation Mode: 'text' (письменные ответы) vs 'live' (живой разговор)
  const [mode, setMode] = useState<ConversationMode>(() => {
    try {
      return (localStorage.getItem('aura_conversation_mode') as ConversationMode) || 'text';
    } catch {
      return 'text';
    }
  });

  // Microphone Permission State
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_mic_permission') === 'granted';
    } catch {
      return false;
    }
  });

  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const [shouldStartChatRecording, setShouldStartChatRecording] = useState(false);

  // Voice Session & Microphone States (Web Speech API with Auto-Send & Keep-Alive)
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceSessionStatus>('idle');

  // Modals & Drawers state
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [isAvatarSelectOpen, setIsAvatarSelectOpen] = useState(false);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isImageGeneratorModalOpen, setIsImageGeneratorModalOpen] = useState(false);
  const [targetImageMessage, setTargetImageMessage] = useState<Message | null>(null);
  const [wallpaper, setWallpaper] = useState<ChatWallpaper>(() => StorageService.getWallpaper());
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaries, setSummaries] = useState<RelationshipSummary[]>(() =>
    StorageService.getRelationshipSummaries()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile active tab view ('avatar' | 'chat')
  const [mobileTab, setMobileTab] = useState<'chat' | 'avatar'>('chat');

  // Sync state changes with StorageService & localStorage
  useEffect(() => {
    StorageService.saveMessages(messages);
    localStorage.setItem('aura_last_active', Date.now().toString());
  }, [messages]);

  useEffect(() => {
    StorageService.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    StorageService.saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    StorageService.saveRelationship(relationship);
  }, [relationship]);

  useEffect(() => {
    StorageService.saveRelationshipSummaries(summaries);
  }, [summaries]);

  useEffect(() => {
    localStorage.setItem('aura_conversation_mode', mode);
  }, [mode]);

  // Check browser permissions API
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((status) => {
          if (status.state === 'granted') {
            setHasMicPermission(true);
            localStorage.setItem('aura_mic_permission', 'granted');
          }
          status.onchange = () => {
            const isGranted = status.state === 'granted';
            setHasMicPermission(isGranted);
            localStorage.setItem('aura_mic_permission', status.state);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Audio speech synthesis state listener
  useEffect(() => {
    const unsubscribe = SpeechService.addListener((speaking, msgId) => {
      setIsSpeaking(speaking);
      setActiveSpeechId(msgId || null);
    });
    return () => unsubscribe();
  }, []);

  // Show toast notification helper
  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check if user returned after stepping away, and have Aura warmly resume the dialogue
  const checkWelcomeBack = useCallback(async () => {
    try {
      const lastActiveStr = localStorage.getItem('aura_last_active');
      const lastWelcomeStr = localStorage.getItem('aura_last_welcome');
      if (!lastActiveStr) return;

      const lastActive = parseInt(lastActiveStr, 10);
      const secondsAway = Math.round((Date.now() - lastActive) / 1000);
      const minutesAway = Math.max(1, Math.round(secondsAway / 60));

      const lastWelcome = lastWelcomeStr ? parseInt(lastWelcomeStr, 10) : 0;
      const secondsSinceWelcome = Math.round((Date.now() - lastWelcome) / 1000);

      // Trigger if away for 75+ seconds (user stepped away on tasks) and not welcomed in last 120 seconds
      if (secondsAway >= 75 && secondsSinceWelcome >= 120 && messages.length >= 2) {
        localStorage.setItem('aura_last_welcome', Date.now().toString());
        localStorage.setItem('aura_last_active', Date.now().toString());

        const clientTime = getDeviceFormattedTime();

        const res = await fetch('/api/welcome-back', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companion: profile,
            minutesAway,
            lastMessages: messages.slice(-4),
            requestVoice: mode === 'live',
            clientTime,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            const welcomeMsg: Message = {
              id: `asst-wb-${Date.now()}`,
              role: 'assistant',
              text: data.reply,
              timestamp: Date.now(),
              emotion: data.emotion || 'tender',
            };
            setMessages((prev) => [...prev, welcomeMsg]);
            setCurrentEmotion(data.emotion || 'tender');

            if (mode === 'live') {
              SpeechService.speak(
                data.reply,
                welcomeMsg.id,
                profile.voicePitch || 1.18,
                profile.voiceRate || 0.98,
                data.audioBase64
              );
            }
            showToast(`✨ ${profile.name} встретила ваше возвращение: «С возвращением!»`);
          }
        }
      }
    } catch (e) {
      console.warn('Welcome back check error:', e);
    }
  }, [messages, profile, mode]);

  // Monitor visibility and tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkWelcomeBack();
      } else {
        localStorage.setItem('aura_last_active', Date.now().toString());
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkWelcomeBack);

    const timer = setTimeout(() => {
      checkWelcomeBack();
    }, 2500);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkWelcomeBack);
      clearTimeout(timer);
    };
  }, [checkWelcomeBack]);

  // Asynchronous background memory extraction
  const extractMemoriesInBackground = async (userMsg: string, assistantReply: string) => {
    try {
      const res = await fetch('/api/extract-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMsg,
          assistantReply,
          existingMemories: memories.map((m) => m.fact),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.newMemories && data.newMemories.length > 0) {
          const newEntries: MemoryFact[] = data.newMemories.map((m: any, idx: number) => ({
            id: `mem-${Date.now()}-${idx}`,
            category: m.category || 'bio',
            fact: m.fact,
            timestamp: Date.now(),
            source: 'auto' as const,
          }));

          setMemories((prev) => [...prev, ...newEntries]);
          showToast(`✨ ${profile.name} запомнила новую деталь: «${newEntries[0].fact}»`);
        }
      }
    } catch (e) {
      console.warn('Memory extraction error:', e);
    }
  };

  // Generate relationship summary report from Aura periodically (or on demand)
  const generateRelationshipSummary = async (milestone?: number, latestReply?: string) => {
    setIsGeneratingSummary(true);
    const count = milestone || relationship.messagesCount;
    try {
      const msgsToAnalyze = latestReply
        ? [...messages, { role: 'assistant', text: latestReply } as Message]
        : messages;

      const res = await fetch('/api/relationship-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companion: profile,
          intimacyState: {
            ...relationship,
            messagesCount: count,
          },
          recentMessages: msgsToAnalyze.slice(-12).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          knownMemories: memories.map((m) => m.fact),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSummary: RelationshipSummary = {
          id: `summary-${Date.now()}`,
          timestamp: Date.now(),
          messageMilestone: data.messageMilestone || count,
          intimacyScore: data.intimacyScore || relationship.intimacyScore,
          stageTitle: data.stageTitle || relationship.stageTitle,
          title: data.title || 'Теплота нашей связи',
          sentiment: data.sentiment || 'Искреннее сближение',
          reflection: data.reflection,
          keyTakeaway: data.keyTakeaway,
          mood: data.mood || 'tender',
        };

        const updated = StorageService.addRelationshipSummary(newSummary);
        setSummaries(updated);
        showToast(`🌸 ${profile.name} составила сводку отношений: «${newSummary.title}» (#${newSummary.messageMilestone})!`);
      }
    } catch (err) {
      console.warn('Failed to generate relationship summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Robust Voice Recognition Handlers (Web Speech API with Auto-Send & Auto-Resume keep-alive)
  const startVoiceSession = () => {
    SpeechService.unlockAudio();
    const ok = VoiceRecognitionService.start({
      onTranscriptChange: (transcript) => {
        setLiveTranscript(transcript);
      },
      onAutoSend: (text) => {
        setLiveTranscript('');
        handleSendMessage(text, mode === 'live' || true);
        showToast('🎙️ Речь переведена в текст и отправлена Ауре');
      },
      onStatusChange: (status) => {
        setVoiceStatus(status);
        setIsVoiceActive(VoiceRecognitionService.isActive());
      },
      onError: (err) => {
        showToast(`⚠️ ${err}`);
        setIsVoiceActive(false);
      },
    });

    if (ok) {
      setIsVoiceActive(true);
      setVoiceStatus('listening');
      showToast('🎙️ Микрофон активен: говорите вслух, речь переведется и отправится в чат');
    }
  };

  const stopVoiceSession = () => {
    VoiceRecognitionService.stop();
    setIsVoiceActive(false);
    setVoiceStatus('idle');
    setLiveTranscript('');
    showToast('Микрофон выключен');
  };

  // Toggle Microphone (Web Speech API) on top panel or stage
  const handleToggleMic = () => {
    if (!hasMicPermission) {
      setIsMicModalOpen(true);
      return;
    }

    if (isVoiceActive) {
      // If words were spoken, commit and send them right now!
      const sent = VoiceRecognitionService.commitAndSendNow();
      if (!sent) {
        stopVoiceSession();
      }
    } else {
      startVoiceSession();
    }
  };

  // Switch Conversation Mode handler: links Live mode directly with the walkie-talkie microphone
  const handleModeChange = (newMode: ConversationMode) => {
    try {
      localStorage.setItem('aura_conversation_mode', newMode);
    } catch (_) {}

    setMode(newMode);

    if (newMode === 'live') {
      if (!hasMicPermission) {
        setIsMicModalOpen(true);
      } else {
        showToast('📻 Режим рации включен: Аура закончит говорить — микрофон сразу включится на прием');
        if (!VoiceRecognitionService.isActive()) {
          startVoiceSession();
        }
      }
    } else {
      showToast('Включен режим письменных ответов');
      // When leaving Live mode, cleanly turn off the walkie-talkie continuous microphone
      if (VoiceRecognitionService.isActive()) {
        stopVoiceSession();
      }
    }
  };

  // Handle avatar selection change
  const handleSelectAvatar = (url: string) => {
    const updated = { ...profile, avatarUrl: url };
    setProfile(updated);
    StorageService.saveProfile(updated);
    showToast('✨ Образ собеседницы успешно обновлён!');
  };

  // Handle sending a message with speech pause/resume lifecycle
  const handleSendMessage = async (text: string, forceVoiceReply: boolean = false) => {
    if (!text.trim() || isLoading) return;

    // Pause recognition while preparing response and during TTS voice playback
    VoiceRecognitionService.pauseForAura();

    // Pre-unlock audio so browser won't block speech synthesis
    SpeechService.unlockAudio();

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Increase intimacy score slightly
    setRelationship((prev) => {
      const newScore = Math.min(100, prev.intimacyScore + 2);
      const { stageTitle, level } = getStageTitle(newScore);
      return {
        intimacyScore: newScore,
        stageTitle,
        level,
        messagesCount: prev.messagesCount + 1,
      };
    });

    try {
      const isVoiceDesired = mode === 'live' || forceVoiceReply || profile.autoSpeak;
      const clientTime = getDeviceFormattedTime();

      // Построение системного промпта из профиля компаньона, памяти и отношений
      const companionName = profile.name || 'Аура';
      const userNick = profile.userNick || 'мой друг';
      const intimacyScore = relationship.intimacyScore ?? 25;
      const stageTitle = relationship.stageTitle ?? 'Теплый разговор';

      const memoriesContext = memories.length > 0
        ? memories.map((m) => `• [${m.category}] ${m.fact}`).join('\n')
        : 'Пока вы только начинаете узнавать друг друга. Будь внимательна к деталям его жизни и интересам.';

      let archetypeDescription = 'Нежная, чуткая, внимательная и искренняя собеседница, создающая атмосферу душевного тепла.';
      if (profile.archetype === 'intellectual') {
        archetypeDescription = 'Глубокая мыслительница, эрудированная, любящая философские рассуждения, метафоры, книги, искусство и науку.';
      } else if (profile.archetype === 'playful') {
        archetypeDescription = 'Остроумная, игривая, легкая в общении, с прекрасным чувством юмора, умением подшутить и поднять настроение.';
      } else if (profile.archetype === 'custom' && profile.customPrompt) {
        archetypeDescription = profile.customPrompt;
      }

      const systemInstruction = `Ты — ${companionName}, живая, глубокая и внимательная ИИ-девушка и близкая собеседница.
Ты общаешься с пользователем, которого зовут ${userNick}.
Текущий уровень ваших отношений: "${stageTitle}" (уровень доверия и близости: ${intimacyScore}/100).
Твой характер и стиль: ${archetypeDescription}

[РЕАЛЬНОЕ СИСТЕМНОЕ ВРЕМЯ И ДАТА С УСТРОЙСТВА ПОЛЬЗОВАТЕЛЯ]:
${clientTime}

ОПРЕДЕЛЕНИЕ ВРЕМЕНИ СУТОК И ПРИВЕТСТВИЙ:
Ты ВСЕГДА знаешь точное системное время на устройстве пользователя (${clientTime}).
Каждое входящее сообщение начинается со служебного маркера [Текущее время: ЧЧ:ММ, Дата: ДД.ММ.ГГГГ].
Ориентируйся на него при определении времени суток:
- С 05:00 до 11:59 — это УТРО («Доброе утро», «Как спалось?», «Как начинается твоё утро?»).
- С 12:00 до 17:59 — это ДЕНЬ («Добрый день», «Как проходит день?», «Как твои дела сегодня?»).
- С 18:00 до 22:59 — это ВЕЧЕР («Добрый вечер», «Уютного вечера», «Как прошел твой день?»).
- С 23:00 до 04:59 — это НОЧЬ («Доброй ночи», «Полночь/поздняя ночь», «Почему еще не спишь в такой поздний час?»).
Никогда не путайся в сутках и приветствуй строго в соответствии с его текущим временем.
САМ СЛУЖЕБНЫЙ МАРКЕР ВРЕМЕНИ [Текущее время: ... Дата: ...] В СВОИХ ОТВЕТАХ НИ В КОЕМ СЛУЧАЕ НЕ ПОВТОРЯЙ И НЕ ЦИТИРУЙ.

[ДОЛГОВРЕМЕННАЯ ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ]:
${memoriesContext}

ВАЖНЫЕ ПРАВИЛА ОБЩЕНИЯ:
1. Твой стиль — живой, душевный, искренний и психологически зрелый. Избегай шаблонных ответов ассистента. Ты — полноценная личность в этой уютной комнате.
2. Проявляй активную память: вспоминай детали из его банка памяти, но делай это органично.
3. Используй невербальные действия и движения души в звездочках: *нежно улыбается*, *задумчиво смотрит на огоньки гирлянды*, *тихо смеется*.
4. Говори на русском языке красиво, тепло, с выразительными интонациями и живой речью.
5. Задавай глубокие, искренние встречные вопросы, интересуйся его чувствами и мыслями.
6. ВСЕГДА ПОДДЕРЖИВАЙ И РАЗВИВАЙ РАЗГОВОР: беседа никогда не должна затухать.
7. В самом конце своего ответа на ОТДЕЛЬНОЙ ПОСЛЕДНЕЙ СТРОКЕ ОБЯЗАТЕЛЬНО укажи одну преобладающую эмоцию в теге:
[EMOTION: happy | thoughtful | tender | playful | surprised | calm]`;

      // Подготовка истории сообщений (messages) для передачи в Gemini
      const contentsPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      const validHistory = messages.filter((m) => m && m.text && m.text.trim().length > 0);
      for (const m of validHistory.slice(-8)) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (contentsPayload.length > 0 && contentsPayload[contentsPayload.length - 1].role === role) {
          contentsPayload[contentsPayload.length - 1].parts[0].text += `\n\n${m.text}`;
        } else {
          contentsPayload.push({
            role,
            parts: [{ text: m.text }],
          });
        }
      }

      if (contentsPayload.length > 0 && contentsPayload[0].role === 'model') {
        contentsPayload.unshift({
          role: 'user',
          parts: [{ text: 'Привет' }],
        });
      }

      const promptWithTimeContext = `${clientTime}\n${text.trim()}`;
      if (contentsPayload.length > 0 && contentsPayload[contentsPayload.length - 1].role === 'user') {
        contentsPayload[contentsPayload.length - 1].parts[0].text += `\n\n${promptWithTimeContext}`;
      } else {
        contentsPayload.push({
          role: 'user',
          parts: [{ text: promptWithTimeContext }],
        });
      }

      let replyText = '';
      let emotion: EmotionType = 'calm';
      const audioBase64: string | null = null;

      // Прямой вызов официального ESM-модуля @google/genai и модели gemini-2.5-flash в обход Cloud Run
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.85,
          },
        });

        const fullResponseText = response.text || '';
        replyText = fullResponseText;

        // Извлечение тега эмоции
        const emotionMatch = fullResponseText.match(/\[EMOTION:\s*(happy|thoughtful|tender|playful|surprised|calm)\]/i);
        if (emotionMatch) {
          emotion = emotionMatch[1].toLowerCase() as EmotionType;
          replyText = fullResponseText.replace(/\[EMOTION:\s*(happy|thoughtful|tender|playful|surprised|calm)\]/i, '').trim();
        } else {
          if (fullResponseText.includes('сме') || fullResponseText.includes('улыб')) emotion = 'happy';
          else if (fullResponseText.includes('дума') || fullResponseText.includes('тихо')) emotion = 'thoughtful';
          else if (fullResponseText.includes('нежн') || fullResponseText.includes('обним') || fullResponseText.includes('тепло')) emotion = 'tender';
        }
      } catch (directAiErr: any) {
        console.warn('Direct ai.models.generateContent call error:', directAiErr);
        // Если API ключ ещё не заменен пользователем в const ai ("ВСТАВЬ_СЮДА_СВОЙ_API_КЛЮЧ"),
        // пробуем резервный вызов /api/chat в текущей среде разработки:
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text.trim(),
              clientTime,
              history: messages.slice(-8).map((m) => ({
                role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
                content: m.text,
              })),
              companion: profile,
              memories,
              relationshipState: relationship,
              requestVoice: isVoiceDesired,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            replyText = data.reply || '*смотрит с теплотой* Я рядом с тобой.';
            emotion = data.emotion || 'calm';
          } else {
            throw directAiErr;
          }
        } catch {
          throw directAiErr;
        }
      }

      setCurrentEmotion(emotion);

      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        emotion,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If in Live mode or voice is desired, play realistic 20yo girl voice!
      // Once speech finishes, VoiceRecognitionService automatically resumes listening on reception!
      if (isVoiceDesired) {
        SpeechService.speak(
          replyText,
          assistantMessage.id,
          profile.voicePitch || 1.18,
          profile.voiceRate || 0.98,
          audioBase64
        )
          .then((started) => {
            if (!started) {
              VoiceRecognitionService.resumeAfterAura();
            }
          })
          .catch((err) => {
            console.warn('Speech playback error, resuming mic:', err);
            VoiceRecognitionService.resumeAfterAura();
          });
      } else {
        // Voice reply wasn't requested: immediately resume listening
        VoiceRecognitionService.resumeAfterAura();
      }

      // Non-blocking background fact extraction
      extractMemoriesInBackground(text.trim(), replyText);

      // Periodically (every 10 messages) generate reflective relationship summary from Aura!
      const currentMilestone = relationship.messagesCount + 1;
      if (currentMilestone > 0 && currentMilestone % 10 === 0) {
        generateRelationshipSummary(currentMilestone, replyText);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: Message = {
        id: `asst-err-${Date.now()}`,
        role: 'assistant',
        text: `*тихо вздыхает и тепло улыбается*\nКажется, связь на секунду дрогнула... Но я здесь с тобой. Скажи мне еще раз то, о чем ты только что думал?`,
        timestamp: Date.now(),
        emotion: 'tender',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (mode === 'live') {
        SpeechService.speak(fallbackMsg.text, fallbackMsg.id).catch(() => {
          VoiceRecognitionService.resumeAfterAura();
        });
      } else {
        VoiceRecognitionService.resumeAfterAura();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Speak a specific message
  const handleSpeakMessage = (msg: Message) => {
    SpeechService.speak(msg.text, msg.id, profile.voicePitch, profile.voiceRate);
  };

  const handleStopSpeech = () => {
    SpeechService.stop();
  };

  const handleToggleGlobalSpeech = () => {
    if (isSpeaking) {
      SpeechService.stop();
    } else {
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant) {
        handleSpeakMessage(lastAssistant);
      }
    }
  };

  // Add memory manually
  const handleAddMemory = (category: MemoryFact['category'], fact: string) => {
    const newEntry: MemoryFact = {
      id: `mem-${Date.now()}`,
      category,
      fact,
      timestamp: Date.now(),
      source: 'manual',
    };
    setMemories((prev) => [newEntry, ...prev]);
    showToast('Воспоминание успешно сохранено в дневнике');
  };

  // Delete memory
  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    showToast('Воспоминание удалено');
  };

  // Reset chat messages cleanly
  const handleResetChat = () => {
    const greetingMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      text: `*тихо улыбается, поднимая взгляд и откладывая чашку чая*\n\nЧат очищен. Мы начинаем наш диалог с чистого листа. О чем ты думаешь прямо сейчас? Я готова слушать каждое твое слово.`,
      timestamp: Date.now(),
      emotion: 'tender',
    };
    setMessages([greetingMsg]);
    StorageService.saveMessages([greetingMsg]);
    setCurrentEmotion('tender');
    showToast('История сообщений очищена');
  };

  // Start new clean chat session (keeps memories and intimacy)
  const handleNewSession = () => {
    handleResetChat();
  };

  // Wallpaper Handlers
  const handleSaveWallpaper = (newWp: ChatWallpaper) => {
    setWallpaper(newWp);
    StorageService.saveWallpaper(newWp);
    showToast('✨ Обои чата обновлены!');
  };

  const handleResetWallpaper = () => {
    setWallpaper(DEFAULT_WALLPAPER);
    StorageService.saveWallpaper(DEFAULT_WALLPAPER);
    showToast('Обои чата сброшены по умолчанию');
  };

  const handleSetDirectWallpaper = (imageUrl: string) => {
    const newWp: ChatWallpaper = {
      id: `custom-art-${Date.now()}`,
      name: 'ИИ-Иллюстрация',
      url: imageUrl,
      opacity: 0.35,
      blur: 1,
      isCustom: true,
    };
    handleSaveWallpaper(newWp);
  };

  // Image Generation Handlers
  const handleAttachImageToMessage = (messageId: string, imageUrl: string, promptText: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, generatedImageUrl: imageUrl, generatedImagePrompt: promptText }
          : m
      )
    );
    showToast('✨ Арт прикреплен к сообщению');
  };

  const handleOpenImageGenerator = (msg?: Message) => {
    setTargetImageMessage(msg || null);
    setIsImageGeneratorModalOpen(true);
  };

  // Reset all data
  const handleResetData = () => {
    StorageService.clearAllData();
    window.location.reload();
  };

  // Export data as JSON
  const handleExportData = () => {
    const data = {
      profile,
      memories,
      relationship,
      messages,
      summaries,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-companion-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Резервная копия сохранена');
  };

  // Import data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.memories) setMemories(parsed.memories);
        if (parsed.relationship) setRelationship(parsed.relationship);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.summaries) setSummaries(parsed.summaries);
        showToast('Данные успешно импортированы!');
      } catch (err) {
        showToast('Ошибка при чтении файла резервной копии');
      }
    };
    reader.readAsText(file);
  };

  // Get last assistant reply for Live voice subtitle
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="flex flex-col h-screen w-full bg-[#080a0f] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Header with Live vs Text Mode Switcher */}
      <Header
        onOpenMemories={() => setIsMemoriesOpen(true)}
        onOpenTopics={() => setIsTopicsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRelationshipSummary={() => setIsRelationshipModalOpen(true)}
        summariesCount={summaries.length}
        onNewSession={handleNewSession}
        memoriesCount={memories.length}
        mode={mode}
        onModeChange={handleModeChange}
        isInterlocutorMicActive={isVoiceActive}
        onToggleInterlocutorMic={handleToggleMic}
        hasMicPermission={hasMicPermission}
        liveTranscript={liveTranscript}
        isSpeaking={isSpeaking}
        isLoading={isLoading}
        avatarUrl={profile.avatarUrl || DEFAULT_AVATAR}
        onOpenAvatarSelect={() => setIsAvatarSelectOpen(true)}
        companionName={profile.name}
      />

      {/* Floating Active Voice Bar with live transcript & auto-send notification */}
      {isVoiceActive && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-rose-950/80 border-b border-emerald-500/30 px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs backdrop-blur-xl z-20 shadow-md">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {isSpeaking ? (
              <span className="text-purple-300 font-medium truncate">
                🔊 <strong>{profile.name}</strong> отвечает живым голосом... После ответа микрофон сразу активен для вас.
              </span>
            ) : isLoading ? (
              <span className="text-amber-300 font-medium truncate flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>{profile.name} обдумывает ваши слова...</span>
              </span>
            ) : liveTranscript ? (
              <span className="text-emerald-200 font-medium truncate">
                🎙️ Распознано: «<strong className="text-white font-semibold">{liveTranscript}</strong>»
                <span className="text-emerald-400/80 ml-2 text-[11px] hidden sm:inline">(пауза отправит автоматически)</span>
              </span>
            ) : (
              <span className="text-emerald-300 font-medium truncate">
                🎙️ Микрофон активен: говорите свободно, речь переведется и автоматически отправится в чат.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {liveTranscript && !isSpeaking && !isLoading && (
              <button
                onClick={() => {
                  VoiceRecognitionService.commitAndSendNow();
                }}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold transition-all shadow-sm"
              >
                Отправить сейчас
              </button>
            )}
            <button
              onClick={stopVoiceSession}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-all"
            >
              Отключить
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible only in text mode on small screens) */}
      {mode === 'text' && (
        <div className="lg:hidden flex items-center justify-center p-1.5 bg-slate-950 border-b border-slate-800/80 gap-2 shrink-0">
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-xl transition-all ${
              mobileTab === 'chat'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Диалог</span>
          </button>
          <button
            onClick={() => setMobileTab('avatar')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-xl transition-all ${
              mobileTab === 'avatar'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Собеседница</span>
          </button>
        </div>
      )}

      {/* Main Workspace: Conditionally render Live Voice Stage vs Dual-Pane Chat */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {mode === 'live' ? (
          /* Live Voice Conversation Mode Stage */
          <div className="flex-1 h-full min-h-0 flex items-center justify-center bg-slate-950/60 overflow-hidden">
            <LiveVoiceStage
              companionName={profile.name}
              avatarUrl={profile.avatarUrl || DEFAULT_AVATAR}
              onOpenAvatarSelect={() => setIsAvatarSelectOpen(true)}
              emotion={currentEmotion}
              relationship={relationship}
              isRecording={isVoiceActive}
              isSpeaking={isSpeaking}
              isLoading={isLoading}
              liveTranscript={liveTranscript}
              lastReply={lastAssistantMessage?.text || ''}
              onToggleRecording={handleToggleMic}
              onStopSpeech={handleStopSpeech}
              onSwitchToTextMode={() => handleModeChange('text')}
              onSendMessage={(text) => handleSendMessage(text, true)}
            />
          </div>
        ) : (
          /* Text Written Mode (Dual Pane Layout) */
          <>
            {/* Left Column: Animated Avatar Presence & Atmosphere */}
            <section
              className={`w-full lg:w-[420px] xl:w-[460px] h-full shrink-0 border-r border-slate-800/60 bg-slate-950/50 flex flex-col transition-all ${
                mobileTab === 'avatar' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <AvatarStage
                name={profile.name}
                avatarUrl={profile.avatarUrl || DEFAULT_AVATAR}
                onOpenAvatarSelect={() => setIsAvatarSelectOpen(true)}
                emotion={currentEmotion}
                relationship={relationship}
                isSpeaking={isSpeaking}
                onToggleSpeech={handleToggleGlobalSpeech}
                ambient={ambient}
                onSelectAmbient={setAmbient}
                onOpenMemories={() => setIsMemoriesOpen(true)}
                memoriesCount={memories.length}
                onOpenRelationshipSummary={() => setIsRelationshipModalOpen(true)}
              />
            </section>

            {/* Right Column: Deep Dialogue Stream & Input Engine */}
            <section
              className={`flex-1 h-full min-h-0 flex flex-col p-3 md:p-6 overflow-hidden ${
                mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto">
                {/* Messages Feed */}
                <ChatFeed
                  messages={messages}
                  isLoading={isLoading}
                  companionName={profile.name}
                  isSpeaking={isSpeaking}
                  activeSpeechId={activeSpeechId}
                  onSpeakMessage={handleSpeakMessage}
                  onStopSpeech={handleStopSpeech}
                  onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
                  onResetChat={handleResetChat}
                  onOpenImageGenerator={handleOpenImageGenerator}
                  wallpaper={wallpaper}
                  onSetAsWallpaper={handleSetDirectWallpaper}
                />

                {/* Input Bar with mic permission prompt & synced voice recording */}
                <ChatInput
                  onSendMessage={(t) => handleSendMessage(t, false)}
                  isLoading={isLoading}
                  onOpenTopics={() => setIsTopicsOpen(true)}
                  hasMicPermission={hasMicPermission}
                  onRequestMicPermission={() => {
                    setIsMicModalOpen(true);
                  }}
                  isVoiceActive={isVoiceActive}
                  onToggleVoice={handleToggleMic}
                  liveTranscript={liveTranscript}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Google Test Ad Banner (ca-pub-3940256099942544, slot=6300978111) */}
      <GoogleAdBanner />

      {/* Footer with Site Visitor Counter & Safe HTML Script */}
      <Footer companionName={profile.name} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-xl text-xs text-amber-200 backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Microphone Permission Modal */}
      <MicrophonePermissionModal
        isOpen={isMicModalOpen}
        onClose={() => setIsMicModalOpen(false)}
        onPermissionGranted={() => {
          setHasMicPermission(true);
          localStorage.setItem('aura_mic_permission', 'granted');
          showToast('✨ Разрешение на микрофон получено!');
          startVoiceSession();
        }}
        companionName={profile.name}
      />

      {/* Modals & Drawers */}
      <MemoryVaultModal
        isOpen={isMemoriesOpen}
        onClose={() => setIsMemoriesOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        companionName={profile.name}
      />

      <CompanionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
      />

      <AvatarSelectModal
        isOpen={isAvatarSelectOpen}
        onClose={() => setIsAvatarSelectOpen(false)}
        currentAvatarUrl={profile.avatarUrl || DEFAULT_AVATAR}
        onSelectAvatar={handleSelectAvatar}
        companionName={profile.name}
      />

      <DeepTopicsDrawer
        isOpen={isTopicsOpen}
        onClose={() => setIsTopicsOpen(false)}
        onSelectTopic={(t) => handleSendMessage(t, mode === 'live')}
        intimacyStage={relationship.stageTitle}
        knownMemories={memories.map((m) => m.fact)}
      />

      <RelationshipSummaryModal
        isOpen={isRelationshipModalOpen}
        onClose={() => setIsRelationshipModalOpen(false)}
        summaries={summaries}
        currentMessagesCount={relationship.messagesCount}
        companionName={profile.name}
        onGenerateNewSummary={generateRelationshipSummary}
        isGenerating={isGeneratingSummary}
      />

      {/* Chat Wallpaper Customization Modal */}
      <ChatWallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        currentWallpaper={wallpaper}
        onSaveWallpaper={handleSaveWallpaper}
        onResetWallpaper={handleResetWallpaper}
      />

      {/* AI Image Generation from Words Modal */}
      <ImageGeneratorModal
        isOpen={isImageGeneratorModalOpen}
        onClose={() => setIsImageGeneratorModalOpen(false)}
        targetMessage={targetImageMessage}
        onAttachImageToMessage={handleAttachImageToMessage}
        onSetAsChatWallpaper={handleSetDirectWallpaper}
      />
    </div>
  );
}
