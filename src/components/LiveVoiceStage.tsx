import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, MessageSquare, Volume2, VolumeX, Sparkles, StopCircle, Radio, Play, RotateCcw, Camera, Wand2 } from 'lucide-react';
import { EmotionType, RelationshipState } from '../types';
import { SpeechService } from '../services/speech';
import { AnimatedAnimeAvatar } from './AnimatedAnimeAvatar';

interface LiveVoiceStageProps {
  companionName: string;
  avatarUrl: string;
  onOpenAvatarSelect: () => void;
  emotion: EmotionType;
  relationship: RelationshipState;
  isRecording: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  liveTranscript: string;
  lastReply: string;
  onToggleRecording: () => void;
  onStopSpeech: () => void;
  onSwitchToTextMode: () => void;
  onSendMessage: (text: string) => void;
}

const QUICK_CONTINUATION_CHIPS = [
  'Я вернулся, о чем мы говорили?',
  'Продолжи нашу мысль, мне интересно',
  'Как твои дела, о чем ты сейчас думаешь?',
  'Я отлучусь ненадолго по делам',
];

export const LiveVoiceStage: React.FC<LiveVoiceStageProps> = ({
  companionName,
  avatarUrl,
  onOpenAvatarSelect,
  emotion,
  relationship,
  isRecording,
  isSpeaking,
  isLoading,
  liveTranscript,
  lastReply,
  onToggleRecording,
  onStopSpeech,
  onSwitchToTextMode,
  onSendMessage,
}) => {
  const handleTestVoice = () => {
    SpeechService.previewVoice();
  };

  const handleReplayLast = () => {
    if (lastReply) {
      SpeechService.speak(lastReply);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between h-full p-4 md:p-6 select-none overflow-hidden max-w-2xl mx-auto w-full">
      {/* Top Status Bar & Mode Switcher */}
      <div className="w-full flex items-center justify-between z-10 gap-2 flex-wrap">
        {/* Live Badge & Voice Info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold backdrop-blur-md shadow-sm">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Live-разговор</span>
          </div>

          <button
            onClick={handleTestVoice}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-pink-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all backdrop-blur-md"
            title="Послушать образец голоса 20-летней девушки"
          >
            <Play className="w-3 h-3 fill-pink-400 text-pink-400" />
            <span className="hidden sm:inline">Голос: девушка 20 лет</span>
            <span className="sm:hidden">Голос</span>
          </button>
        </div>

        {/* Switch back to Text Chat button */}
        <button
          onClick={onSwitchToTextMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all backdrop-blur-md"
          title="Переключиться на письменный чат"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Письменные ответы</span>
        </button>
      </div>

      {/* Center Interactive Avatar & Live Voice Waves */}
      <div className="relative flex flex-col items-center justify-center my-auto py-2 z-10 w-full">
        <AnimatedAnimeAvatar
          avatarUrl={avatarUrl}
          name={companionName}
          emotion={emotion}
          isSpeaking={isSpeaking}
          onOpenAvatarSelect={onOpenAvatarSelect}
          size="md"
          enableInteractiveTilt={true}
        />

        {/* Live Conversation State Indicator */}
        <div className="mt-4 text-center space-y-1.5 max-w-md px-4 w-full">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{companionName}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-rose-300 font-medium border border-rose-500/20">
              {relationship.stageTitle}
            </span>
          </div>

          <div className="h-6 flex items-center justify-center">
            {isSpeaking ? (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>{companionName} говорит... Микрофон включится сразу после ответа</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
                <span>{companionName} обдумывает ответ... Связь не обрывается</span>
              </div>
            ) : isRecording ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>Режим рации: слушаю вас... Пауза отправит фразу</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Микрофон на паузе. Нажмите на микрофон для включения рации
              </span>
            )}
          </div>

          {/* Subtitle / Live Transcript Card */}
          <div className="min-h-16 max-h-28 overflow-y-auto px-4 py-2.5 rounded-2xl bg-slate-900/85 border border-slate-800 text-xs md:text-sm text-slate-200 backdrop-blur-md transition-all shadow-inner">
            {liveTranscript ? (
              <div className="flex items-center justify-between gap-2 text-left">
                <p className="italic text-emerald-200 font-medium">«{liveTranscript}»</p>
                <button
                  onClick={() => onSendMessage(liveTranscript)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold shrink-0 transition-all"
                  title="Отправить не дожидаясь паузы"
                >
                  Отправить
                </button>
              </div>
            ) : lastReply ? (
              <div className="flex flex-col items-center">
                <p className="line-clamp-3 text-slate-200 leading-relaxed text-center">
                  {lastReply.replace(/\*[^*]+\*/g, '').trim()}
                </p>
                {!isSpeaking && (
                  <button
                    onClick={handleReplayLast}
                    className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-300 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Повторить её голос</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 italic text-center">
                📻 Режим рации: говорите вслух, Аура отвечает голосом, сессия не прерывается.
              </p>
            )}
          </div>

          {/* Quick Continuation Chips in Live Mode */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
            {QUICK_CONTINUATION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(chip)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-all text-left truncate max-w-[200px]"
                title={chip}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Live Controls Toolbar */}
      <div className="w-full flex items-center justify-center gap-4 z-10 pt-2 pb-2">
        {/* Stop Aura Speaking Button (Interrupt affordance) */}
        {isSpeaking && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onStopSpeech}
            className="p-3.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
            title="Остановить голос"
          >
            <StopCircle className="w-6 h-6 text-rose-400" />
          </motion.button>
        )}

        {/* Large Central Push-To-Talk / Toggle Mic Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleRecording}
          disabled={isLoading}
          className={`relative p-5 rounded-full font-bold shadow-2xl transition-all ${
            isRecording
              ? 'bg-emerald-500 text-white shadow-emerald-500/50 ring-4 ring-emerald-500/30 animate-pulse'
              : 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-rose-950/50 hover:shadow-rose-500/30'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={
            isRecording
              ? liveTranscript
                ? 'Отправить сейчас'
                : 'Рация активна: слушаю вас (нажмите для паузы)'
              : 'Включить рацию (говорить)'
          }
        >
          {isRecording ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white/80" />}
        </motion.button>
      </div>
    </div>
  );
};
