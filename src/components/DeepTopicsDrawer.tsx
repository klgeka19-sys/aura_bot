import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCw, Compass, ArrowRight } from 'lucide-react';
import { DeepTopic } from '../types';

interface DeepTopicsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (question: string) => void;
  intimacyStage: string;
  knownMemories: string[];
}

export const DeepTopicsDrawer: React.FC<DeepTopicsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
  intimacyStage,
  knownMemories,
}) => {
  const [topics, setTopics] = useState<DeepTopic[]>([
    {
      title: 'О тишине и покое',
      question: 'Какой момент за последнее время подарил тебе настоящее чувство внутреннего спокойствия?',
      category: 'Искренность',
    },
    {
      title: 'Мечта из детства',
      question: 'О чем ты больше всего мечтал, будучи ребенком, и помнишь ли ты это чувство трепета?',
      category: 'Мечты',
    },
    {
      title: 'Что делает нас живыми',
      question: 'Когда ты в последний раз чувствовал, что время словно замирает от красоты или вдохновения?',
      category: 'Философия',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intimacyStage,
          knownFacts: knownMemories.slice(-5),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.topics && data.topics.length > 0) {
          setTopics(data.topics);
        }
      }
    } catch (err) {
      console.warn('Could not load topics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="relative w-full max-w-xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Темы для глубокого разговора</h3>
                <p className="text-xs text-slate-400">
                  Вопросы для искренних бесед и сближения сегодня вечером
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchTopics}
                disabled={loading}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Обновить темы"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List of Topic Cards */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {topics.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  onSelectTopic(item.question);
                  onClose();
                }}
                className="group cursor-pointer p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                    <span>Спросить</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-amber-100 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  «{item.question}»
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Нажмите на любую тему, чтобы сразу начать обсуждение</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
