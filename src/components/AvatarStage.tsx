import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Volume2, VolumeX, Moon, Flame, Sunset, BookOpen, Camera, Wand2 } from 'lucide-react';
import { EmotionType, RelationshipState, AmbientLighting } from '../types';
import { AnimatedAnimeAvatar } from './AnimatedAnimeAvatar';

interface AvatarStageProps {
  name: string;
  avatarUrl: string;
  onOpenAvatarSelect: () => void;
  emotion: EmotionType;
  relationship: RelationshipState;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  ambient: AmbientLighting;
  onSelectAmbient: (ambient: AmbientLighting) => void;
  onOpenMemories: () => void;
  memoriesCount: number;
  onOpenRelationshipSummary?: () => void;
}

const EMOTION_LABELS: Record<EmotionType, { title: string; desc: string; glow: string; accentColor: string }> = {
  calm: {
    title: 'Умиротворение',
    desc: 'Внимательно слушает и чувствует покой',
    glow: 'rgba(56, 189, 248, 0.35)',
    accentColor: '#38bdf8',
  },
  happy: {
    title: 'Искренняя радость',
    desc: 'Теплая улыбка и свет в глазах',
    glow: 'rgba(251, 191, 36, 0.45)',
    accentColor: '#fbbf24',
  },
  thoughtful: {
    title: 'Задумчивость',
    desc: 'Размышляет над твоими словами',
    glow: 'rgba(168, 85, 247, 0.4)',
    accentColor: '#a855f7',
  },
  tender: {
    title: 'Нежность',
    desc: 'Глубокая душевная поддержка и забота',
    glow: 'rgba(244, 114, 182, 0.45)',
    accentColor: '#f472b6',
  },
  playful: {
    title: 'Игривость',
    desc: 'Легкий задор и живой интерес',
    glow: 'rgba(251, 146, 60, 0.4)',
    accentColor: '#fb923c',
  },
  surprised: {
    title: 'Удивление',
    desc: 'Открыла для себя что-то неожиданное',
    glow: 'rgba(129, 140, 248, 0.4)',
    accentColor: '#818cf8',
  },
};

const AMBIENT_CONFIG: Record<AmbientLighting, { name: string; bgGradient: string; icon: React.ReactNode }> = {
  cozy_evening: {
    name: 'Теплый вечер',
    bgGradient: 'from-amber-950/20 via-slate-900/60 to-[#080a0f]',
    icon: <Sunset className="w-3.5 h-3.5" />,
  },
  candlelight: {
    name: 'Свечи',
    bgGradient: 'from-orange-950/25 via-slate-900/70 to-[#07090e]',
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  twilight_blue: {
    name: 'Ночные огни',
    bgGradient: 'from-indigo-950/30 via-slate-900/80 to-[#06080d]',
    icon: <Moon className="w-3.5 h-3.5" />,
  },
};

export const AvatarStage: React.FC<AvatarStageProps> = ({
  name,
  avatarUrl,
  onOpenAvatarSelect,
  emotion,
  relationship,
  isSpeaking,
  onToggleSpeech,
  ambient,
  onSelectAmbient,
  onOpenMemories,
  memoriesCount,
  onOpenRelationshipSummary,
}) => {
  const currentEmotion = EMOTION_LABELS[emotion] || EMOTION_LABELS.calm;

  return (
    <div className="relative flex flex-col items-center justify-between h-full p-4 md:p-6 select-none overflow-hidden">
      {/* Background Room Atmosphere with Subtle Parallax Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/src/assets/images/cozy_room_backdrop_1791625398817.jpg"
          alt="Cozy room atmosphere"
          className="w-full h-full object-cover opacity-25 filter blur-xs scale-105 transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${AMBIENT_CONFIG[ambient].bgGradient} transition-colors duration-700`} />
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#080a0f]/60 to-[#080a0f]" />
      </div>

      {/* Top Atmosphere Bar & Ambient Switcher */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2 max-w-md">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800/80 rounded-xl backdrop-blur-md">
          {(Object.keys(AMBIENT_CONFIG) as AmbientLighting[]).map((key) => {
            const cfg = AMBIENT_CONFIG[key];
            const isActive = ambient === key;
            return (
              <button
                key={key}
                onClick={() => onSelectAmbient(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 text-amber-200 shadow-sm border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={cfg.name}
              >
                {cfg.icon}
                <span className="hidden sm:inline">{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Live Motion Status & Audio Speech Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAvatarSelect}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-300 text-xs font-medium hover:bg-pink-500/20 transition-all backdrop-blur-md shadow-sm"
            title="Сменить аниме-образ"
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Образ</span>
          </button>

          <button
            onClick={onToggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all backdrop-blur-md ${
              isSpeaking
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={isSpeaking ? 'Остановить голос' : 'Включить озвучку'}
          >
            {isSpeaking ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'Говорит...' : 'Голос'}</span>
          </button>
        </div>
      </div>

      {/* Center Interactive Animated Anime Avatar */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <AnimatedAnimeAvatar
          avatarUrl={avatarUrl}
          name={name}
          emotion={emotion}
          isSpeaking={isSpeaking}
          onOpenAvatarSelect={onOpenAvatarSelect}
          size="lg"
          enableInteractiveTilt={true}
        />

        {/* Live Animation Status Badge */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={onOpenAvatarSelect}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 hover:text-pink-300 hover:border-pink-500/40 transition-colors backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Живые движения: взгляд, дыхание, речь</span>
          </button>
        </div>

        {/* Name & Mood Status Description */}
        <div className="text-center mt-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 font-normal">
              {currentEmotion.title}
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 line-clamp-1 italic">
            «{currentEmotion.desc}»
          </p>
        </div>
      </div>

      {/* Bottom Relationship & Memories Connection Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
            <span>Уровень близости:</span>
            <span className="text-white font-semibold">{relationship.stageTitle}</span>
          </div>
          <span className="text-slate-400 tabular-nums">{relationship.intimacyScore}%</span>
        </div>

        {/* Intimacy progress bar */}
        <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden mb-2.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(5, relationship.intimacyScore))}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full"
          />
        </div>

        {/* Relationship Summary & Memory Vault triggers */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs gap-1.5 flex-wrap">
          {onOpenRelationshipSummary ? (
            <button
              onClick={onOpenRelationshipSummary}
              className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 text-[11px]"
              title="Открыть сводку отношений от Ауры"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
              <span>Сводка связи ({relationship.messagesCount})</span>
            </button>
          ) : (
            <span className="text-slate-400 text-[11px]">
              {relationship.messagesCount} сообщений
            </span>
          )}
          <button
            onClick={onOpenMemories}
            className="flex items-center gap-1.5 text-slate-300 hover:text-amber-200 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-slate-800/60 text-[11px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Память ({memoriesCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
