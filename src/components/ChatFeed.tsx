import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Copy, Check, ArrowDown, Sparkles } from 'lucide-react';
import { Message } from '../types';

interface ChatFeedProps {
  messages: Message[];
  isLoading: boolean;
  companionName: string;
  isSpeaking: boolean;
  activeSpeechId: string | null;
  onSpeakMessage: (msg: Message) => void;
  onStopSpeech: () => void;
}

// Function to render formatted text with thoughts/actions highlighted
function renderFormattedMessage(text: string) {
  // Regex to match *action* segments
  const parts = text.split(/(\*[^*]+\*)/g);

  return (
    <div className="space-y-2 leading-relaxed break-words whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          const actionText = part.slice(1, -1);
          return (
            <span
              key={index}
              className="inline-block my-0.5 text-rose-200/85 italic font-serif text-[0.95em] bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-500/10"
            >
              *{actionText}*
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  isLoading,
  companionName,
  isSpeaking,
  activeSpeechId,
  onSpeakMessage,
  onStopSpeech,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on new messages or loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-0 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
      {/* Scrollable messages container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Sparkles className="w-8 h-8 text-rose-400/60 mb-2 animate-pulse" />
            <p className="text-sm font-medium text-slate-400">Начните разговор</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {companionName} внимательно слушает и сохраняет ваши мысли и переживания в долгосрочной памяти.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isThisPlaying = isSpeaking && activeSpeechId === msg.id;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              {/* Message Header (Sender & Timestamp) */}
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">
                  {isAssistant ? companionName : 'Вы'}
                </span>
                <span>·</span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Bubble Container */}
              <div
                className={`group relative max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 md:px-5 md:py-3.5 text-sm md:text-[15px] shadow-sm transition-all ${
                  isAssistant
                    ? 'bg-slate-900/90 text-slate-100 border border-slate-800/90 rounded-tl-sm'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-tr-sm shadow-rose-950/20'
                }`}
              >
                {renderFormattedMessage(msg.text)}

                {/* Assistant Message Actions Toolbar */}
                {isAssistant && (
                  <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-800/60 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => (isThisPlaying ? onStopSpeech() : onSpeakMessage(msg))}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                        isThisPlaying
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title={isThisPlaying ? 'Остановить озвучку' : 'Озвучить сообщение'}
                    >
                      {isThisPlaying ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[11px] text-rose-400">Стоп</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">Слушать</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => copyText(msg.id, msg.text)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Скопировать текст"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading / Generating State Bubble */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-sm rounded-tl-sm text-slate-300 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <span className="italic text-slate-400">
                {companionName} задумчиво подбирает слова...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Quick Scroll-To-Bottom Floating Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-700"
            title="Прокрутить вниз"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
