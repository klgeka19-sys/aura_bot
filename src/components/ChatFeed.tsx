import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowDown,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Trash2,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Message, ChatWallpaper } from '../types';

interface ChatFeedProps {
  messages: Message[];
  isLoading: boolean;
  companionName: string;
  isSpeaking: boolean;
  activeSpeechId: string | null;
  onSpeakMessage: (msg: Message) => void;
  onStopSpeech: () => void;
  onOpenWallpaper: () => void;
  onResetChat: () => void;
  onOpenImageGenerator: (msg?: Message) => void;
  wallpaper?: ChatWallpaper;
  onSetAsWallpaper?: (imageUrl: string) => void;
  onOpenSourceCode?: () => void;
}

// Function to render formatted text with thoughts/actions highlighted
function renderFormattedMessage(text: string) {
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
  onOpenWallpaper,
  onResetChat,
  onOpenImageGenerator,
  wallpaper,
  onSetAsWallpaper,
  onOpenSourceCode,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      {/* Background Wallpaper Layer */}
      {wallpaper && wallpaper.url && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-500 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${wallpaper.url})`,
            opacity: wallpaper.opacity ?? 0.35,
            filter: `blur(${wallpaper.blur ?? 1}px)`,
          }}
        />
      )}
      {/* Gentle dark gradient layer over wallpaper for 100% text contrast */}
      {wallpaper && wallpaper.url && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-slate-950/50 via-slate-950/30 to-slate-950/70" />
      )}

      {/* Top Header of Chat Area: Status & Quick Controls */}
      <div className="relative flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-200 truncate">{companionName}</span>
          <span className="text-[10px] text-slate-500 hidden md:inline">• Тёплый диалог</span>
        </div>

        {/* Action buttons: Wallpaper, AI Art Generation, Reset Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Wallpaper customization button */}
          <button
            onClick={onOpenWallpaper}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors shadow-sm"
            title="Установить обои в чате (загрузить с телефона или ПК, либо готовые темы)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden xs:inline">Обои чата</span>
            <span className="xs:hidden">Обои</span>
          </button>

          {/* AI Image Generation button */}
          <button
            onClick={() => onOpenImageGenerator()}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-medium transition-colors shadow-sm"
            title="Сгенерировать изображение из любых слов с помощью ИИ"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="hidden sm:inline">Создать арт</span>
            <span className="sm:hidden">Арт</span>
          </button>

          {/* Code Export button */}
          {onOpenSourceCode && (
            <button
              onClick={onOpenSourceCode}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium transition-colors shadow-sm"
              title="Экспорт исходного кода приложения (скопировать файлы или весь проект)"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Экспорт кода</span>
              <span className="sm:hidden">Код</span>
            </button>
          )}

          {/* Reset chat button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/25 text-xs font-medium transition-colors shadow-sm"
            title="Сбросить историю сообщений в чате"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Сброс чата</span>
            <span className="sm:hidden">Сброс</span>
          </button>
        </div>
      </div>

      {/* Reset Chat Confirmation Banner */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-20 bg-rose-950/90 border-b border-rose-500/40 px-4 py-2.5 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Очистить переписку? Воспоминания и профиль сохранятся.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onResetChat();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Да, очистить чат
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable messages container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6"
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
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  {isAssistant ? companionName : 'Вы'}
                </span>
                <span>·</span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Bubble Container */}
              <div
                className={`group relative max-w-[94%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 md:px-5 md:py-3.5 text-sm md:text-[15px] shadow-sm transition-all ${
                  isAssistant
                    ? 'bg-slate-900/90 text-slate-100 border border-slate-800/90 rounded-tl-sm backdrop-blur-sm'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-tr-sm shadow-rose-950/20 backdrop-blur-sm'
                }`}
              >
                {/* Text Content */}
                {renderFormattedMessage(msg.text)}

                {/* Attached AI Generated Artwork */}
                {msg.generatedImageUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-black/50 group/img relative">
                    <img
                      src={msg.generatedImageUrl}
                      alt={msg.generatedImagePrompt || 'Сгенерированная ИИ иллюстрация'}
                      className="w-full max-h-72 object-cover rounded-2xl"
                      referrerPolicy="no-referrer"
                    />

                    {/* Image Action Overlay */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity bg-slate-950/85 p-1 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                      {onSetAsWallpaper && (
                        <button
                          onClick={() => onSetAsWallpaper(msg.generatedImageUrl!)}
                          className="px-2 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/35 text-pink-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Установить это изображение как обои чата"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>В обои</span>
                        </button>
                      )}
                      <a
                        href={msg.generatedImageUrl}
                        download={`aura-art-${msg.id}.png`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Скачать изображение"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Assistant Message Actions Toolbar */}
                {isAssistant && (
                  <div className="flex flex-wrap items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60 opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* Voice audio synthesis button */}
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

                    {/* AI Image Generation Button for this response */}
                    <button
                      onClick={() => onOpenImageGenerator(msg)}
                      className="p-1.5 rounded-lg text-xs flex items-center gap-1 text-pink-300 hover:text-white hover:bg-pink-500/20 bg-pink-500/10 border border-pink-500/25 transition-all shadow-sm"
                      title="Сгенерировать художественную иллюстрацию по словам из этого ответа"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      <span className="text-[11px] font-medium hidden sm:inline">Создать арт</span>
                      <span className="text-[11px] font-medium sm:hidden">Арт</span>
                    </button>

                    {/* Copy text button */}
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
