import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { ChatWallpaper } from '../types';
import { WALLPAPER_PRESETS, processUploadedWallpaper } from '../services/storage';

interface ChatWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: ChatWallpaper;
  onSaveWallpaper: (wallpaper: ChatWallpaper) => void;
  onResetWallpaper: () => void;
}

export const ChatWallpaperModal: React.FC<ChatWallpaperModalProps> = ({
  isOpen,
  onClose,
  currentWallpaper,
  onSaveWallpaper,
  onResetWallpaper,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentWallpaper.id || 'starry_room');
  const [customUrl, setCustomUrl] = useState<string>(currentWallpaper.isCustom ? currentWallpaper.url : '');
  const [opacity, setOpacity] = useState<number>(currentWallpaper.opacity ?? 0.35);
  const [blur, setBlur] = useState<number>(currentWallpaper.blur ?? 1);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentPreviewUrl = customUrl || WALLPAPER_PRESETS.find((p) => p.id === selectedPresetId)?.url || '';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите файл изображения (JPG, PNG, WebP)');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const dataUrl = await processUploadedWallpaper(file);
      setCustomUrl(dataUrl);
      setSelectedPresetId('custom');
    } catch (err: any) {
      console.warn('Wallpaper upload error:', err);
      setUploadError('Не удалось обработать изображение. Попробуйте другой файл.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (preset: ChatWallpaper) => {
    setSelectedPresetId(preset.id);
    setCustomUrl('');
    if (preset.id === 'none') {
      setOpacity(0);
      setBlur(0);
    } else if (opacity === 0) {
      setOpacity(0.35);
      setBlur(1);
    }
  };

  const handleApply = () => {
    const isCustom = selectedPresetId === 'custom' && !!customUrl;
    const finalWallpaper: ChatWallpaper = {
      id: isCustom ? 'custom' : selectedPresetId,
      name: isCustom
        ? 'Моё фото'
        : WALLPAPER_PRESETS.find((p) => p.id === selectedPresetId)?.name || 'Обои чата',
      url: isCustom
        ? customUrl
        : WALLPAPER_PRESETS.find((p) => p.id === selectedPresetId)?.url || '',
      opacity,
      blur,
      isCustom,
    };
    onSaveWallpaper(finalWallpaper);
    onClose();
  };

  const handleReset = () => {
    onResetWallpaper();
    setSelectedPresetId('starry_room');
    setCustomUrl('');
    setOpacity(0.35);
    setBlur(1);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Обои заднего фона в чате</h3>
                <p className="text-xs text-slate-400">
                  Загрузите любое фото с телефона или ПК или выберите уютную атмосферу
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Live Interactive Preview Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Предпросмотр фона диалога
              </label>
              <div className="relative h-32 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center bg-slate-950">
                {currentPreviewUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                    style={{
                      backgroundImage: `url(${currentPreviewUrl})`,
                      opacity: opacity,
                      filter: `blur(${blur}px)`,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-950" />
                )}
                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/70" />

                {/* Sample chat bubble to test text readability */}
                <div className="relative z-10 max-w-[85%] bg-slate-900/90 border border-slate-800/90 px-3.5 py-2 rounded-2xl text-xs text-slate-200 shadow-lg backdrop-blur-sm">
                  <span className="font-semibold text-rose-300">Аура:</span>{' '}
                  <span>В этой уютной атмосфере наши разговоры звучат особенно тепло...</span>
                </div>
              </div>
            </div>

            {/* Upload Button: From Phone or PC */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>Загрузить свои обои</span>
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-slate-400" />
                  <Laptop className="w-3 h-3 text-slate-400" />
                  <span>Телефон / ПК</span>
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="wallpaper-upload-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
                    <span>Обработка фотографии...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-rose-400" />
                    <span>Выбрать фото из галереи или файлов</span>
                  </>
                )}
              </button>

              {customUrl && selectedPresetId === 'custom' && (
                <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                  <span>✓ Пользовательское фото успешно загружено</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrl('');
                      setSelectedPresetId('starry_room');
                    }}
                    className="text-slate-400 hover:text-white underline"
                  >
                    Удалить
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
              )}
            </div>

            {/* Preset Atmospheric Wallpapers */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Готовые атмосферные темы
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {WALLPAPER_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id && !customUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative flex flex-col items-center p-2 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/15 ring-1 ring-rose-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-slate-900 border border-white/10">
                        {preset.url ? (
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-950 flex items-center justify-center text-[11px] text-slate-500">
                            Тёмный фон
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-500 text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-white truncate w-full text-center">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders: Opacity & Blur for perfect contrast */}
            {currentPreviewUrl && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <span>Настройка читаемости чата</span>
                </div>

                {/* Opacity slider */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Видимость обоев:</span>
                    <span className="font-mono text-rose-300">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                  />
                  <span className="text-[10px] text-slate-500">
                    Рекомендуется 25–45% для комфортного чтения сообщений
                  </span>
                </div>

                {/* Blur slider */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Мягкое размытие (Blur):</span>
                    <span className="font-mono text-rose-300">{blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={blur}
                    onChange={(e) => setBlur(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>По умолчанию</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 shadow-md shadow-rose-950/40 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Применить обои</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
