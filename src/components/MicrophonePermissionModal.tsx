import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ShieldCheck, X, Sparkles, AlertCircle, Volume2 } from 'lucide-react';

interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  companionName: string;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
  companionName,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает доступ к микрофону');
      }

      // Explicitly prompt the user for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test tracks immediately
      stream.getTracks().forEach((track) => track.stop());

      setIsRequesting(false);
      onPermissionGranted();
      onClose();
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      setIsRequesting(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Доступ к микрофону был отклонен. Чтобы разрешить, нажмите на значок замочка в адресной строке браузера и включите микрофон.'
        );
      } else {
        setErrorMessage(
          err.message || 'Не удалось получить доступ к микрофону. Проверьте подключение устройства.'
        );
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/40">
                <Mic className="w-8 h-8 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-slate-700 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Включить голосовой ввод?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Разрешите доступ к микрофону, чтобы {companionName} могла слышать ваш голос в реальном времени.
              </p>
            </div>
          </div>

          {/* Benefits List */}
          <div className="my-5 space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
            <div className="flex items-start gap-2.5 text-slate-300">
              <Mic className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>Голосовое общение:</strong> говорите с собеседницей своими словами без необходимости печатать на клавиатуре.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Live-разговор:</strong> естественная беседа, где {companionName} отвечает вам живым голосом.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Приватность:</strong> аудио распознается непосредственно в вашем браузере.
              </span>
            </div>
          </div>

          {/* Error notice if denied */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={handleRequestAccess}
              disabled={isRequesting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-rose-950/30 transition-all disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Запрос доступа...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Разрешить микрофон</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              Позже
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
