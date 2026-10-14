import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Download,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Wand2,
  Copy,
  Layers,
  Palette,
  Maximize2,
} from 'lucide-react';
import { Message } from '../types';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  targetMessage?: Message | null;
  onAttachImageToMessage?: (messageId: string, imageUrl: string, prompt: string) => void;
  onSetAsChatWallpaper?: (imageUrl: string) => void;
}

const STYLES = [
  { id: 'anime', label: 'Аниме шедевр', desc: 'Мягкий свет, студийная рисовка' },
  { id: 'cozy', label: 'Уютный Lo-Fi', desc: 'Теплые лампы, вечерняя атмосфера' },
  { id: 'realistic', label: 'Реализм 8K', desc: 'Кинематографичный свет, боке' },
  { id: 'watercolor', label: 'Нежная акварель', desc: 'Пастельные краски, легкие мазки' },
  { id: 'cyberpunk', label: 'Неоновые сумерки', desc: 'Глубокие фиолетовые и розовые огни' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Квадрат' },
  { id: '16:9', label: '16:9 Обои / Экран' },
  { id: '9:16', label: '9:16 Смартфон' },
  { id: '3:4', label: '3:4 Портрет' },
];

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  targetMessage = null,
  onAttachImageToMessage,
  onSetAsChatWallpaper,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('anime');
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedPromptUsed, setGeneratedPromptUsed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isWallpaperSet, setIsWallpaperSet] = useState<boolean>(false);
  const [isAttached, setIsAttached] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setPrompt(initialPrompt);
      } else if (targetMessage) {
        // Clean thought actions to craft clean prompt
        const clean = targetMessage.text
          .replace(/\*[^*]+\*/g, '')
          .replace(/\[EMOTION:[^\]]+\]/gi, '')
          .trim();
        setPrompt(clean.slice(0, 180));
      } else {
        setPrompt('Уютная комната, нежный вечерний свет, чашка чая на столе у окна');
      }
      setIsWallpaperSet(false);
      setIsAttached(false);
      setError(null);
    }
  }, [isOpen, initialPrompt, targetMessage]);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !targetMessage?.text) return;

    setIsGenerating(true);
    setError(null);
    setIsWallpaperSet(false);
    setIsAttached(false);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          messageText: targetMessage?.text || '',
          style: selectedStyle,
          aspectRatio: selectedRatio,
        }),
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setGeneratedPromptUsed(data.styledPrompt || data.prompt || prompt);

        // Auto-attach to target message if launched from a message
        if (targetMessage && onAttachImageToMessage) {
          onAttachImageToMessage(targetMessage.id, data.imageUrl, prompt);
          setIsAttached(true);
        }
      } else {
        setError(data.error || 'Не удалось сгенерировать изображение. Попробуйте другие слова.');
      }
    } catch (err: any) {
      console.warn('Image generation error:', err);
      setError('Сетевая ошибка при генерации изображения. Попробуйте еще раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `aura-art-${Date.now()}.png`;
    a.click();
  };

  const handleApplyAsWallpaper = () => {
    if (!generatedImageUrl || !onSetAsChatWallpaper) return;
    onSetAsChatWallpaper(generatedImageUrl);
    setIsWallpaperSet(true);
    setTimeout(() => setIsWallpaperSet(false), 2500);
  };

  const handleAttach = () => {
    if (!generatedImageUrl || !targetMessage || !onAttachImageToMessage) return;
    onAttachImageToMessage(targetMessage.id, generatedImageUrl, prompt);
    setIsAttached(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-pink-500/10 border border-pink-500/25 text-pink-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Генерация иллюстрации из слов</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                    ИИ-Арт
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {targetMessage
                    ? 'Создайте художественный образ по словам из ответа Ауры'
                    : 'Опишите словами то, что хотите увидеть, и ИИ создаст изображение'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form & Workspace */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Prompt input field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Описание / Слова для генерации:</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (русский или английский текст)
                </span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Например: Аура сидит у окна осенним вечером, пьет горячий чай, капли дождя на стекле, уютная лампа..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500/60 leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Quick Presets of Style & Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Style options */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>Художественный стиль:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-left text-xs transition-all ${
                        selectedStyle === style.id
                          ? 'border-pink-500 bg-pink-500/20 text-pink-200 font-semibold ring-1 ring-pink-500/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  <span>Формат кадра:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-center text-xs transition-all ${
                        selectedRatio === ratio.id
                          ? 'border-pink-500 bg-pink-500/20 text-pink-200 font-semibold ring-1 ring-pink-500/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Action Button */}
            <div>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating || (!prompt.trim() && !targetMessage?.text)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-pink-950/40 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ИИ воплощает образ в изображение...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Сгенерировать иллюстрацию</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message Feedback */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Result Area */}
            {generatedImageUrl && (
              <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5 text-pink-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Иллюстрация готова!</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedRatio} • {selectedStyle}
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-800 group bg-black/60 flex items-center justify-center max-h-[360px]">
                  <img
                    src={generatedImageUrl}
                    alt={prompt}
                    className="w-full max-h-[360px] object-contain rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Actions with the generated image */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {onSetAsChatWallpaper && (
                    <button
                      type="button"
                      onClick={handleApplyAsWallpaper}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/35 text-xs font-semibold transition-all shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{isWallpaperSet ? '✓ Обои установлены!' : 'Сделать обоями чата'}</span>
                    </button>
                  )}

                  {targetMessage && onAttachImageToMessage && (
                    <button
                      type="button"
                      onClick={handleAttach}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/35 text-xs font-semibold transition-all shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAttached ? '✓ Прикреплено к ответу' : 'Прикрепить к ответу'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать арт</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-[11px] text-slate-500">
              Сгенерированные изображения можно сохранять и делать живыми обоями
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all text-xs"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
