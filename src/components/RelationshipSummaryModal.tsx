import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Sparkles, Volume2, VolumeX, RefreshCw, Calendar, Quote, CheckCircle2, Award } from 'lucide-react';
import { RelationshipSummary, EmotionType } from '../types';
import { SpeechService } from '../services/speech';

interface RelationshipSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaries: RelationshipSummary[];
  currentMessagesCount: number;
  companionName: string;
  onGenerateNewSummary: () => Promise<void>;
  isGenerating: boolean;
}

export const RelationshipSummaryModal: React.FC<RelationshipSummaryModalProps> = ({
  isOpen,
  onClose,
  summaries,
  currentMessagesCount,
  companionName,
  onGenerateNewSummary,
  isGenerating,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);

  if (!isOpen) return null;

  const currentSummary =
    (selectedId ? summaries.find((s) => s.id === selectedId) : null) || summaries[0] || null;

  const nextMilestone = Math.ceil((currentMessagesCount + 1) / 10) * 10;
  const messagesToNext = Math.max(0, nextMilestone - currentMessagesCount);

  const handleSpeak = () => {
    if (!currentSummary) return;
    if (isSpeakingSummary) {
      SpeechService.stop();
      setIsSpeakingSummary(false);
    } else {
      setIsSpeakingSummary(true);
      SpeechService.speak(currentSummary.reflection).then(() => {
        setIsSpeakingSummary(false);
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/40 via-slate-900 to-pink-950/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-300 shadow-sm">
                <Heart className="w-5 h-5 fill-rose-400/40 text-rose-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Сводка отношений</span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
                    Каждые 10 сообщений
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Как {companionName} чувствует развитие вашей связи и тепла
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader: Milestone Navigation if multiple summaries exist */}
          {summaries.length > 1 && (
            <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-slate-400 shrink-0 font-medium mr-1">
                Главы связи:
              </span>
              {summaries.map((s, idx) => {
                const isActive = (currentSummary?.id === s.id) || (!currentSummary && idx === 0);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedId(s.id);
                      SpeechService.stop();
                      setIsSpeakingSummary(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-rose-500/20 border border-rose-500/50 text-rose-200 shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Award className="w-3 h-3 text-rose-400" />
                    <span>#{s.messageMilestone} сообщений</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {currentSummary ? (
              <div className="space-y-4">
                {/* Milestone info banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 font-semibold">
                      Рубеж #{currentSummary.messageMilestone}
                    </span>
                    <span className="text-slate-300 font-medium">
                      Уровень: <strong className="text-white">{currentSummary.stageTitle}</strong> ({currentSummary.intimacyScore}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {new Date(currentSummary.timestamp).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Report Title & Sentiment */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-[11px] font-medium border border-rose-500/20">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>{currentSummary.sentiment}</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                    {currentSummary.title}
                  </h4>
                </div>

                {/* Aura's Letter / Reflection Content */}
                <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-inner">
                  <div className="text-sm text-slate-200 leading-relaxed space-y-3 font-sans whitespace-pre-line">
                    {currentSummary.reflection}
                  </div>

                  {/* Romantic Key Takeaway */}
                  {currentSummary.keyTakeaway && (
                    <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex items-start gap-2.5 bg-rose-950/20 p-3 rounded-xl border border-rose-500/20">
                      <Quote className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-rose-200 font-medium italic">
                        {currentSummary.keyTakeaway}
                      </p>
                    </div>
                  )}

                  {/* Aura signature */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="italic">— Твоя {companionName}</span>
                    <button
                      onClick={handleSpeak}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSpeakingSummary
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-950/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Послушать голос собеседницы"
                    >
                      {isSpeakingSummary ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Остановить озвучку</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                          <span>Послушать голос</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state if no summaries generated yet */
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 fill-rose-500/20" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-base font-semibold text-white">
                    Первая сводка готовится...
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {companionName} автоматически формирует сводку отношений каждые 10 сообщений.
                    Сейчас в вашей истории <strong className="text-slate-200">{currentMessagesCount}</strong> сообщений.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onGenerateNewSummary}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{companionName} пишет сводку...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Составить первую сводку сейчас</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {messagesToNext === 0
                  ? 'Сводка готова к обновлению!'
                  : `До следующей авто-сводки: ${messagesToNext} сообщений`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onGenerateNewSummary}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-medium disabled:opacity-50"
                title="Сгенерировать свежую сводку на основе последних бесед"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Создание...' : 'Обновить сводку'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
