import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, BookOpen, Sparkles, Search, Brain, Calendar } from 'lucide-react';
import { MemoryFact } from '../types';

interface MemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryFact[];
  onAddMemory: (category: MemoryFact['category'], fact: string) => void;
  onDeleteMemory: (id: string) => void;
  companionName: string;
}

const CATEGORY_NAMES: Record<MemoryFact['category'], { label: string; color: string }> = {
  bio: { label: 'Личность и биография', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  preference: { label: 'Вкусы и привычки', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  dream: { label: 'Мечты и стремления', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  event: { label: 'События и даты', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  emotion: { label: 'Чувства и переживания', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  companionName,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryFact['category']>('preference');

  if (!isOpen) return null;

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = m.fact.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddMemory(newCategory, newFact.trim());
    setNewFact('');
    setIsAdding(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Дневник воспоминаний</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                    {memories.length} фактов
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Что {companionName} бережно помнит о вас и ваших беседах
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

          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по сохраненным воспоминаниям..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-medium hover:opacity-95 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Запомнить факт</span>
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-white text-slate-900 font-medium'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Все категории ({memories.length})
              </button>
              {(Object.keys(CATEGORY_NAMES) as MemoryFact['category'][]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 font-medium'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {CATEGORY_NAMES[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* New Memory Fact Form */}
          <AnimatePresence>
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreate}
                className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3"
              >
                <div className="text-xs font-semibold text-rose-300">
                  Добавить новое воспоминание вручную:
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    {(Object.keys(CATEGORY_NAMES) as MemoryFact['category'][]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_NAMES[cat].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    placeholder="Например: Любит пить зеленый чай с жасмином по вечерам..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!newFact.trim()}
                      className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of Memories */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5">
            {filteredMemories.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-medium text-slate-400">Воспоминаний пока нет</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Общайтесь с {companionName} — она автоматически будет улавливать ваши вкусы, привычки и мысли, или добавьте их вручную выше.
                </p>
              </div>
            ) : (
              filteredMemories.map((mem) => {
                const catInfo = CATEGORY_NAMES[mem.category] || CATEGORY_NAMES.preference;
                return (
                  <motion.div
                    key={mem.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-start justify-between gap-3 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {mem.source === 'auto' && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
                            <Sparkles className="w-3 h-3" />
                            <span>Узнала в разговоре</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-normal">
                        {mem.fact}
                      </p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(mem.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                      title="Удалить это воспоминание"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 text-center text-xs text-slate-400">
            Воспоминания бесшовно передаются в память {companionName} при каждом ответе, создавая непрерывный контекст.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
