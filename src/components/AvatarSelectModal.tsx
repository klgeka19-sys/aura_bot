import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Image as ImageIcon, Sparkles, Upload, Link2, Camera, Wand2 } from 'lucide-react';
import { ANIME_AVATARS, REALISTIC_AVATARS, ALL_AVATARS, DEFAULT_AVATAR } from '../services/storage';

interface AvatarSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  onSelectAvatar: (url: string) => void;
  companionName: string;
}

export const AvatarSelectModal: React.FC<AvatarSelectModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
  companionName,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatarUrl || DEFAULT_AVATAR);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'anime' | 'realistic' | 'custom'>('anime');

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectAvatar(selectedUrl);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomUrlApply = () => {
    if (customUrlInput.trim()) {
      setSelectedUrl(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const currentOption = ALL_AVATARS.find((a) => a.url === selectedUrl);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Внешность {companionName}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Аниме с движениями
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Выберите аниме-образ с живой мимикой или переключитесь на реалистичное фото
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

          {/* Active Preview Banner */}
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-500/70 shrink-0 shadow-lg">
              <img
                src={selectedUrl}
                alt="Selected preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 p-0.5 bg-pink-500 text-white rounded-full">
                <Check className="w-3 h-3" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200">Выбранная внешность:</div>
              <div className="text-xs text-slate-400 truncate mt-0.5">
                {currentOption ? `${currentOption.name} — ${currentOption.description}` : 'Пользовательский аватар'}
              </div>
              <div className="text-[11px] text-pink-300/90 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>
                  {currentOption?.hasLiveMotion
                    ? '✨ Поддерживает 2.5D поворот за курсором, моргание глаз и мимику речи'
                    : 'Отображается в живом режиме, аудиокомнате и чате'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 px-5 pt-3 gap-2 bg-slate-900/40">
            <button
              onClick={() => setActiveTab('anime')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'anime'
                  ? 'border-pink-500 text-pink-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Аниме (с движениями) ({ANIME_AVATARS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('realistic')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'realistic'
                  ? 'border-pink-500 text-pink-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Реалистичные ({REALISTIC_AVATARS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'border-pink-500 text-pink-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Своё фото / Ссылка</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'anime' && (
              <div className="space-y-3">
                <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-pink-200">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>
                    Аниме-аватарки синхронизированы с живыми движениями: плавное дыхание, моргание, мимика при разговоре и взгляд за курсором мыши.
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {ANIME_AVATARS.map((avatar) => {
                    const isSelected = selectedUrl === avatar.url;
                    return (
                      <motion.div
                        key={avatar.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedUrl(avatar.url)}
                        className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all p-3 flex items-center gap-3.5 ${
                          isSelected
                            ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-950/30'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="p-1 rounded-full bg-pink-500 text-white shadow-md">
                                <Check className="w-4 h-4" />
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-bold text-white truncate">{avatar.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold whitespace-nowrap">
                              Живая
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {avatar.description}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900 text-pink-300 border border-pink-500/30">
                              {avatar.styleTag}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'realistic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {REALISTIC_AVATARS.map((avatar) => {
                  const isSelected = selectedUrl === avatar.url;
                  return (
                    <motion.div
                      key={avatar.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedUrl(avatar.url)}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all p-3 flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-950/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-rose-500/20 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="p-1 rounded-full bg-rose-500 text-white shadow-md">
                              <Check className="w-4 h-4" />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-white truncate">{avatar.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 whitespace-nowrap">
                            20 лет
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {avatar.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900 text-rose-300 border border-rose-500/20">
                            {avatar.styleTag}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Загрузить фото с устройства
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl p-6 cursor-pointer bg-slate-900/50 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">
                      Нажмите для выбора изображения
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP до 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Или указать прямую веб-ссылку (URL)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomUrlApply}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl transition-colors"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Отмена
            </button>

            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-pink-900/40 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить аватарку</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
