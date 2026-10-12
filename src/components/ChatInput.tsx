import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Compass, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onOpenTopics: () => void;
  hasMicPermission: boolean;
  onRequestMicPermission: () => void;
  isVoiceActive?: boolean;
  onToggleVoice?: () => void;
  liveTranscript?: string;
  shouldStartRecording?: boolean;
  onRecordingStarted?: () => void;
}

const QUICK_PROMPTS = [
  'Я вернулся, о чем мы говорили?',
  'Продолжи нашу мысль, мне интересно',
  'Я отойду ненадолго по делам',
  'Как ты себя чувствуешь прямо сейчас?',
  'У меня был непростой день, можно просто поговорить?',
  'Что для тебя значит искренность?',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenTopics,
  hasMicPermission,
  onRequestMicPermission,
  isVoiceActive = false,
  onToggleVoice,
  liveTranscript = '',
  shouldStartRecording,
  onRecordingStarted,
}) => {
  const [text, setText] = useState('');
  const [internalRecording, setInternalRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const effectiveRecording = onToggleVoice ? isVoiceActive : internalRecording;

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setInternalRecording(false);
  };

  const startRecognition = () => {
    stopRecognition();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ru-RU';

      recognition.onstart = () => {
        setInternalRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Speech recognition status:', e.error);
        }
        stopRecognition();
      };

      recognition.onend = () => {
        setInternalRecording(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      stopRecognition();
    }
  };

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, []);

  // Auto-start recording after permission is granted via modal
  useEffect(() => {
    if (shouldStartRecording) {
      startRecognition();
      onRecordingStarted?.();
    }
  }, [shouldStartRecording]);

  const handleMicClick = () => {
    if (!isSpeechSupported) return;

    if (onToggleVoice) {
      onToggleVoice();
      return;
    }

    if (internalRecording) {
      stopRecognition();
      return;
    }

    if (!hasMicPermission) {
      onRequestMicPermission();
    } else {
      startRecognition();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (!onToggleVoice) {
      stopRecognition();
    }

    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="w-full space-y-2 pt-2">
      {/* Quick Discussion Prompts Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={onOpenTopics}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors whitespace-nowrap shrink-0"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Глубокие темы</span>
        </button>

        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleQuickPrompt(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative flex items-end gap-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2 md:p-2.5 backdrop-blur-xl shadow-lg focus-within:border-rose-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={effectiveRecording ? (liveTranscript ? `«${liveTranscript}»` : 'Слушаю вас... Говорите в микрофон') : 'Напишите искренне или нажмите на микрофон...'}
          disabled={isLoading}
          className="flex-1 bg-transparent border-0 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 text-sm md:text-[15px] resize-none py-1.5 px-2 max-h-32 min-h-[38px] leading-relaxed"
        />

        {/* Audio Mic Button with explicit permission prompt */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isSpeechSupported}
          className={`p-2 rounded-xl transition-all ${
            !isSpeechSupported
              ? 'opacity-40 cursor-not-allowed text-slate-600'
              : effectiveRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={
            !isSpeechSupported
              ? 'Голосовой ввод не поддерживается в этом браузере'
              : !hasMicPermission
              ? 'Запросить разрешение на микрофон'
              : effectiveRecording
              ? 'Микрофон включен. Нажмите, чтобы остановить или отправить'
              : 'Включить голосовой ввод (Web Speech API)'
          }
        >
          {effectiveRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className={`p-2.5 rounded-xl font-medium transition-all ${
            text.trim() && !isLoading
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Отправить (Enter)"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
