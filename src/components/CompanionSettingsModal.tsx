import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, RotateCcw, Download, Upload, Check, Heart, Sparkles, Brain, User, Wand2, Camera, Code2, Image as ImageIcon } from 'lucide-react';
import { Archetype, CompanionProfile } from '../types';
import { SpeechService } from '../services/speech';
import { ANIME_AVATARS, REALISTIC_AVATARS } from '../services/storage';

interface CompanionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanionProfile;
  onSaveProfile: (profile: CompanionProfile) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSourceCode?: () => void;
  onOpenWallpaper?: () => void;
}

const ARCHETYPES: Array<{ id: Archetype; title: string; desc: string; icon: React.ReactNode }> = [
  {
    id: 'caring',
    title: 'Заботливая и нежная',
    desc: 'Чуткая поддержка, душевное тепло, искреннее сопереживание и уют',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'intellectual',
    title: 'Философ и мыслитель',
    desc: 'Глубокие рассуждения, метафоры, книги, искусство, поиск смыслов',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'playful',
    title: 'Остроумная и игривая',
    desc: 'Тонкий юмор, подколы, эмоциональный задор и легкая ирония',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'custom',
    title: 'Индивидуальный характер',
    desc: 'Напишите свой персональный стиль и манеру общения',
    icon: <User className="w-4 h-4 text-sky-400" />,
  },
];

export const CompanionSettingsModal: React.FC<CompanionSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetData,
  onExportData,
  onImportData,
  onOpenSourceCode,
  onOpenWallpaper,
}) => {
  const [formData, setFormData] = useState<CompanionProfile>({ ...profile });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Настройки собеседницы</h3>
                <p className="text-xs text-slate-400">Персонализация характера, голоса и данных</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Names configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Имя собеседницы
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Как к вам обращаться
                </label>
                <input
                  type="text"
                  value={formData.userNick}
                  onChange={(e) => setFormData({ ...formData, userNick: e.target.value })}
                  placeholder="Например: Алекс, Саша..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Avatar & Visual style selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Внешность и аватарка</span>
                </label>
                <span className="text-[11px] text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full font-medium">
                  Аниме с движениями
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[...ANIME_AVATARS, ...REALISTIC_AVATARS].slice(0, 6).map((av) => {
                  const isSelected = formData.avatarUrl === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: av.url })}
                      className={`relative flex flex-col items-center p-2 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500/15 shadow-md shadow-pink-950/40 ring-1 ring-pink-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden mb-1.5 border border-white/10">
                        <img
                          src={av.url}
                          alt={av.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="p-0.5 rounded-full bg-pink-500 text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                        {av.category === 'anime' && (
                          <span className="absolute bottom-0.5 right-0.5 p-0.5 bg-slate-950/80 rounded text-[9px] text-pink-300">
                            ✨
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white truncate w-full">
                        {av.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full">
                        {av.category === 'anime' ? 'Живое аниме' : 'Реализм'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Archetype choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Характер и стиль общения
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ARCHETYPES.map((arch) => {
                  const isSelected = formData.archetype === arch.id;
                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, archetype: arch.id })}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-950/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {arch.icon}
                        <span className={`text-xs font-semibold ${isSelected ? 'text-rose-200' : 'text-slate-200'}`}>
                          {arch.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {arch.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Prompt Textarea if custom archetype */}
            {formData.archetype === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="block text-xs font-semibold text-rose-300">
                  Опишите манеру речи и детали персонажа:
                </label>
                <textarea
                  rows={3}
                  value={formData.customPrompt}
                  onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                  placeholder="Опишите характер, манеру говорить, общие интересы..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
                />
              </motion.div>
            )}

            {/* Voice & Speech synthesis settings */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Автоматическая озвучка ответов
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Приятный живой голос девушки 20 лет при каждом сообщении
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoSpeak}
                  onChange={(e) => setFormData({ ...formData, autoSpeak: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-xs text-slate-300">Проверить звучание голоса:</span>
                <button
                  type="button"
                  onClick={() => SpeechService.previewVoice()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Послушать голос девушки</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Тональность голоса: {formData.voicePitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={formData.voicePitch}
                  onChange={(e) => setFormData({ ...formData, voicePitch: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Data Management Section */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300">
                Управление данными и резервное копирование
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onExportData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Экспорт профиля (JSON)</span>
                </button>

                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Импорт профиля</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={onImportData}
                    className="hidden"
                  />
                </label>

                {onOpenSourceCode && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSourceCode();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-200 border border-pink-500/30 text-xs font-medium transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5 text-pink-400" />
                    <span>Экспорт исходного кода</span>
                  </button>
                )}

                {onOpenWallpaper && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWallpaper();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 text-xs font-medium transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Обои чата</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить всё</span>
                </button>
              </div>

              {showConfirmReset && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2">
                  <p className="text-xs text-rose-200">
                    Вы уверены? Это сотрет историю диалогов и дневник воспоминаний.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetData();
                        setShowConfirmReset(false);
                        onClose();
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Да, очистить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(false)}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-rose-950/30 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Сохранено!</span>
                  </>
                ) : (
                  <span>Сохранить изменения</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
