import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Camera, Radio, Smile, Eye } from 'lucide-react';
import { EmotionType } from '../types';

interface AnimatedAnimeAvatarProps {
  avatarUrl: string;
  name: string;
  emotion: EmotionType;
  isSpeaking: boolean;
  onOpenAvatarSelect?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  enableInteractiveTilt?: boolean;
}

const KAOMOJI_BY_EMOTION: Record<EmotionType, string> = {
  calm: '(✿◡‿◡)',
  happy: '(≧◡≦) ♡',
  thoughtful: '(˘⌣˘ )',
  tender: '(｡♥‿♥｡)',
  playful: '(◕‿◕✿)',
  surprised: '(⊙_⊙) !',
};

const EMOTION_GLOWS: Record<EmotionType, { glow: string; accent: string; blushOpacity: number }> = {
  calm: { glow: 'rgba(147, 197, 253, 0.4)', accent: '#93c5fd', blushOpacity: 0.35 },
  happy: { glow: 'rgba(251, 191, 36, 0.45)', accent: '#f59e0b', blushOpacity: 0.65 },
  thoughtful: { glow: 'rgba(192, 132, 252, 0.4)', accent: '#c084fc', blushOpacity: 0.3 },
  tender: { glow: 'rgba(244, 114, 182, 0.55)', accent: '#ec4899', blushOpacity: 0.8 },
  playful: { glow: 'rgba(251, 146, 60, 0.45)', accent: '#f97316', blushOpacity: 0.6 },
  surprised: { glow: 'rgba(56, 189, 248, 0.45)', accent: '#38bdf8', blushOpacity: 0.45 },
};

export const AnimatedAnimeAvatar: React.FC<AnimatedAnimeAvatarProps> = ({
  avatarUrl,
  name,
  emotion,
  isSpeaking,
  onOpenAvatarSelect,
  size = 'lg',
  enableInteractiveTilt = true,
}) => {
  const [blink, setBlink] = useState(false);
  const [mouthState, setMouthState] = useState<'closed' | 'half' | 'open'>('closed');
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const emotionConfig = EMOTION_GLOWS[emotion] || EMOTION_GLOWS.calm;
  const kaomoji = KAOMOJI_BY_EMOTION[emotion] || KAOMOJI_BY_EMOTION.calm;

  // Natural Blinking animation loop
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => {
        setBlink(false);
        // 25% chance of cute double blink
        if (Math.random() < 0.25) {
          setTimeout(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 140);
          }, 180);
        }
      }, 150);

      const nextDelay = 3200 + Math.random() * 3500;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Lip-sync speech animation loop when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthState('closed');
      return;
    }

    const mouthPhonemes: Array<'closed' | 'half' | 'open'> = ['half', 'open', 'half', 'open', 'half', 'closed'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % mouthPhonemes.length;
      setMouthState(mouthPhonemes[idx]);
    }, 130 + Math.random() * 40);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Interactive 2.5D Parallax mouse/pointer tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableInteractiveTilt || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);

    // Limit maximum tilt angle for gentle natural anime parallax
    const clampedX = Math.max(-1, Math.min(1, dx));
    const clampedY = Math.max(-1, Math.min(1, dy));

    setTilt({
      rotateY: clampedX * 8, // looking left/right
      rotateX: -clampedY * 6, // looking up/down
      x: clampedX * 5,
      y: clampedY * 4,
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, x: 0, y: 0 });
  };

  // Interactive tap / click reaction
  const handleAvatarClick = (e: React.MouseEvent) => {
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 600);

    // Spawn floating heart particles on tap
    const newHearts = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -20 - Math.random() * 40,
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1400);

    // Also notify avatar selection if not already triggered
    if (onOpenAvatarSelect && e.altKey) {
      onOpenAvatarSelect();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-24 h-24 sm:w-28 sm:h-28',
    md: 'w-40 h-40 sm:w-44 sm:h-44',
    lg: 'w-52 h-52 sm:w-60 sm:h-60 md:w-68 md:h-68',
    xl: 'w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80',
  }[size];

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      className="relative flex items-center justify-center select-none"
      style={{ perspective: 800 }}
    >
      {/* Dynamic Anime Ambient Aura & Glow Rings */}
      <motion.div
        animate={{
          boxShadow: `0 0 70px 25px ${emotionConfig.glow}`,
          scale: isSpeaking ? [1, 1.05, 1] : [1, 1.02, 1],
        }}
        transition={{
          duration: isSpeaking ? 1.0 : 3.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative rounded-full p-2 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${emotionConfig.accent}40 0%, rgba(255, 255, 255, 0.04) 75%)`,
        }}
      >
        {/* Animated Outer Pulsing Ring for Speech / Emotion */}
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.12, 1] : [1, 1.03, 1],
            opacity: isSpeaking ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: isSpeaking ? 0.9 : 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full border border-pink-400/40 pointer-events-none"
        />

        {/* Floating Heart Particles */}
        {floatingHearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.6, x: h.x, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, x: h.x * 1.5, y: h.y - 70 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute z-40 pointer-events-none text-rose-400 text-xl font-bold"
          >
            ❤️
          </motion.div>
        ))}

        {/* 2.5D Parallax Interactive Container */}
        <motion.div
          animate={{
            rotateX: tilt.rotateX,
            rotateY: tilt.rotateY,
            x: tilt.x,
            y: tilt.y + (isSpeaking ? (Math.sin(Date.now() / 200) * 1.5) : 0),
            scale: isTapped ? 1.06 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 24,
          }}
          onClick={handleAvatarClick}
          className={`relative ${sizeClasses} rounded-full overflow-hidden border-2 border-white/25 shadow-2xl bg-slate-950 cursor-pointer group`}
          title="Нажмите для реакции или смены внешности"
        >
          {/* Main Character Image with Breathing & Sway Loop */}
          <motion.img
            src={avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
            animate={{
              // Lifelike breathing motion & subtle anime hair sway
              scale: isSpeaking ? [1.02, 1.05, 1.02] : [1, 1.025, 1],
              y: [0, -3.5, 0],
            }}
            transition={{
              duration: isSpeaking ? 1.4 : 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Anime Soft Lighting Highlights */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 25%, ${emotionConfig.accent} 0%, transparent 65%)`,
            }}
          />

          {/* Cute Anime Cheeks Blush Overlay with Animation */}
          <motion.div
            animate={{
              opacity: isTapped ? 0.9 : emotionConfig.blushOpacity,
              scale: isTapped ? 1.1 : 1,
            }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge flex justify-between items-center px-10 sm:px-14"
          >
            {/* Left cheek blush */}
            <div className="w-8 h-4 rounded-full bg-pink-400/50 filter blur-sm transform -translate-y-1" />
            {/* Right cheek blush */}
            <div className="w-8 h-4 rounded-full bg-pink-400/50 filter blur-sm transform -translate-y-1" />
          </motion.div>

          {/* Animated Anime Eye Blinking (Upper eyelid / eyelash shadow overlay) */}
          <AnimatePresence>
            {blink && (
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 0.95 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.12, ease: 'easeInOut' }}
                style={{ transformOrigin: 'top center' }}
                className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center"
              >
                {/* Eyelash curves across the eye level */}
                <div className="w-full flex justify-around px-8 sm:px-12 transform -translate-y-3">
                  <div className="w-10 h-1.5 bg-slate-900 rounded-full shadow-sm border-b-2 border-slate-700/80 transform rotate-2" />
                  <div className="w-10 h-1.5 bg-slate-900 rounded-full shadow-sm border-b-2 border-slate-700/80 transform -rotate-2" />
                </div>
                {/* Soft eye shadow */}
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Anime Talking / Lip-Sync Overlay when speaking */}
          {isSpeaking && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Mouth movement positioned at anime mouth area */}
              <motion.div
                animate={{
                  scaleY: mouthState === 'open' ? 1.6 : mouthState === 'half' ? 1.1 : 0.4,
                  scaleX: mouthState === 'open' ? 1.2 : mouthState === 'half' ? 1.0 : 0.8,
                  opacity: mouthState === 'closed' ? 0.3 : 0.9,
                }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="w-4 h-2.5 bg-rose-500/85 rounded-full border border-rose-300 shadow-sm transform translate-y-7 sm:translate-y-9"
              />
            </div>
          )}

          {/* Live Audio Waves Indicator along bottom border when speaking */}
          {isSpeaking && (
            <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-1 bg-slate-950/80 py-1 backdrop-blur-md border-t border-rose-500/30">
              {[0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 0.4].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: ['4px', `${h * 16}px`, '4px'] }}
                  transition={{
                    duration: 0.45 + (i % 3) * 0.1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-1 bg-gradient-to-t from-pink-500 to-rose-300 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Quick Avatar Change Button overlay on hover */}
          {onOpenAvatarSelect && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenAvatarSelect();
              }}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px] cursor-pointer"
            >
              <span className="p-2.5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 shadow-lg mb-1 transform group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-white" />
              </span>
              <span className="text-xs font-semibold tracking-wide">Сменить аниме</span>
              <span className="text-[10px] text-pink-200">Галерея образов</span>
            </div>
          )}
        </motion.div>

        {/* Cute Floating Anime Kaomoji Badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -3, 0] }}
          transition={{
            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 0.3 },
          }}
          key={emotion}
          className="absolute -top-2 -left-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-pink-500/30 shadow-lg flex items-center gap-1.5 backdrop-blur-md text-xs font-medium text-pink-300 cursor-pointer"
          onClick={handleAvatarClick}
          title="Эмоция аниме-собеседницы"
        >
          <Sparkles className="w-3 h-3 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono text-[11px] font-bold">{kaomoji}</span>
        </motion.div>

        {/* Emotion Mood Orb on Top Right */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          key={`orb-${emotion}`}
          className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg flex items-center justify-center backdrop-blur-md text-sm"
          style={{ color: emotionConfig.accent }}
        >
          {emotion === 'tender' && <Heart className="w-4 h-4 fill-current text-rose-400" />}
          {emotion === 'happy' && <Smile className="w-4 h-4 text-amber-400" />}
          {emotion === 'thoughtful' && <Eye className="w-4 h-4 text-purple-400" />}
          {emotion === 'calm' && <Sparkles className="w-4 h-4 text-sky-400" />}
          {emotion === 'playful' && <Sparkles className="w-4 h-4 text-orange-400" />}
          {emotion === 'surprised' && <Sparkles className="w-4 h-4 text-cyan-400" />}
        </motion.div>
      </motion.div>

      {/* Floating Sparkle Motes in Anime Aesthetic */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[
          { top: '10%', left: '5%', delay: 0 },
          { top: '20%', right: '8%', delay: 1.2 },
          { bottom: '15%', left: '10%', delay: 2.4 },
        ].map((pos, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [0, -12, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + idx,
              delay: pos.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute text-pink-300/60 text-xs pointer-events-none"
            style={pos as React.CSSProperties}
          >
            ✦
          </motion.div>
        ))}
      </div>
    </div>
  );
};
