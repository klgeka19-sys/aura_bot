export class SpeechService {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static activeAudio: HTMLAudioElement | null = null;
  private static onStateChangeListeners: Array<(isPlaying: boolean, currentMessageId?: string) => void> = [];
  private static currentMessageId: string | null = null;
  private static isAudioUnlocked = false;
  private static backendTtsCooldownUntil = 0;

  public static addListener(listener: (isPlaying: boolean, currentMessageId?: string) => void) {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private static notify(isPlaying: boolean, msgId?: string) {
    this.onStateChangeListeners.forEach((l) => {
      try {
        l(isPlaying, msgId);
      } catch (err) {
        console.warn('Listener error in SpeechService:', err);
      }
    });
  }

  /**
   * Unlock Web Audio & SpeechSynthesis on any user touch/click gesture
   */
  public static unlockAudio() {
    if (this.isAudioUnlocked || typeof window === 'undefined') return;
    try {
      this.isAudioUnlocked = true;
      if (this.synth) {
        if (this.synth.paused) {
          this.synth.resume();
        }
        // Warm up voices
        this.synth.getVoices();
      }
      // Warm up an audio context or audio element
      const dummyAudio = new Audio();
      dummyAudio.volume = 0;
      dummyAudio.play().catch(() => {});
    } catch (_) {}
  }

  /**
   * Clean text for speaking: remove asterisks (*thoughts*), emotion tags, URLs, and emojis
   */
  public static cleanForSpeech(text: string): string {
    return text
      .replace(/\*[^*]+\*/g, '') // remove *actions and thoughts*
      .replace(/\[EMOTION:[^\]]+\]/gi, '') // remove emotion tags
      .replace(/https?:\/\/\S+/gi, '') // remove links
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '') // remove emojis
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Play pre-generated ultra-realistic audio from Gemini TTS (base64 WAV or MP3)
   */
  public static playAudioBase64(base64Data: string, messageId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.stop();
      this.unlockAudio();

      try {
        const audioSrc = base64Data.startsWith('data:')
          ? base64Data
          : `data:audio/wav;base64,${base64Data}`;
        const audio = new Audio(audioSrc);
        this.activeAudio = audio;
        this.currentMessageId = messageId || null;

        audio.onplay = () => {
          this.notify(true, this.currentMessageId || undefined);
        };

        audio.onended = () => {
          this.activeAudio = null;
          this.currentMessageId = null;
          this.notify(false);
          resolve(true);
        };

        audio.onerror = (e) => {
          console.warn('Audio playback error, falling back to browser synthesis:', e);
          this.activeAudio = null;
          this.currentMessageId = null;
          this.notify(false);
          resolve(false);
        };

        audio.play().catch((err) => {
          console.warn('Audio play catch:', err);
          this.activeAudio = null;
          this.currentMessageId = null;
          this.notify(false);
          resolve(false);
        });
      } catch (err) {
        console.warn('Could not initialize audio:', err);
        resolve(false);
      }
    });
  }

  /**
   * Speak text with ultra-realistic young girl voice (Gemini TTS Kore) or Web Speech fallback
   */
  public static async speak(
    text: string,
    messageId?: string,
    pitch: number = 1.18,
    rate: number = 0.98,
    precomputedAudioBase64?: string | null
  ): Promise<boolean> {
    this.unlockAudio();

    // 1. If precomputed realistic voice is already provided, play it directly
    if (typeof precomputedAudioBase64 === 'string' && precomputedAudioBase64.trim().length > 0) {
      const ok = await this.playAudioBase64(precomputedAudioBase64, messageId);
      if (ok) return true;
    }

    // Clean text: strip action descriptions inside asterisks (*...*) and emotion tags
    const cleanText = this.cleanForSpeech(text);
    if (!cleanText) {
      this.currentMessageId = null;
      this.notify(false);
      return false;
    }

    // 2. If precomputedAudioBase64 is strictly null, the backend already handled TTS (and had no audio or quota was reached).
    // Do NOT make another duplicate request to /api/tts! Immediately use browser synthesis for instantaneous playback.
    if (precomputedAudioBase64 === null) {
      return this.speakWithBrowserSynth(cleanText, messageId, pitch, rate);
    }

    // 3. If precomputedAudioBase64 is undefined (e.g. user clicked replay on a chat bubble),
    // check if we are in cooldown from previous quota limit before requesting /api/tts
    if (Date.now() < this.backendTtsCooldownUntil) {
      return this.speakWithBrowserSynth(cleanText, messageId, pitch, rate);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const played = await this.playAudioBase64(data.audioBase64, messageId);
          if (played) return true;
        } else {
          // Backend signaled fallback to browser
          this.backendTtsCooldownUntil = Date.now() + 10 * 60 * 1000;
        }
      }
    } catch (_err) {
      // Backend TTS unavailable or timed out; cooldown to avoid repeated network failures
      this.backendTtsCooldownUntil = Date.now() + 10 * 60 * 1000;
    }

    // 4. Fallback: Web Speech API tuned for a melodic, young 20-year-old girl voice
    return this.speakWithBrowserSynth(cleanText, messageId, pitch, rate);
  }

  /**
   * Speak using Browser Web Speech Synthesis tuned for a young, pleasant 20yo female tone
   */
  public static speakWithBrowserSynth(
    cleanText: string,
    messageId?: string,
    pitch: number = 1.18,
    rate: number = 0.98
  ): boolean {
    if (!this.synth) return false;

    this.stop();
    this.unlockAudio();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Youthful, pleasant feminine register (pitch: 1.18, rate: 0.98)
    utterance.pitch = pitch;
    utterance.rate = rate;

    // Prefer youthful Russian female voices
    const voices = this.synth.getVoices();
    const ruFemaleVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('ru') &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('milena') ||
            v.name.toLowerCase().includes('tatyana') ||
            v.name.toLowerCase().includes('alisa') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('katya') ||
            v.name.toLowerCase().includes('yandex') ||
            v.name.toLowerCase().includes('svetlana') ||
            v.name.toLowerCase().includes('dariya') ||
            v.name.toLowerCase().includes('irina') ||
            v.name.toLowerCase().includes('google русский'))
      ) ||
      voices.find((v) => v.lang.startsWith('ru')) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (ruFemaleVoice) {
      utterance.voice = ruFemaleVoice;
    }

    this.currentMessageId = messageId || null;
    this.activeUtterance = utterance;

    utterance.onstart = () => {
      this.notify(true, this.currentMessageId || undefined);
    };

    utterance.onend = () => {
      this.currentMessageId = null;
      this.activeUtterance = null;
      this.notify(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      this.currentMessageId = null;
      this.activeUtterance = null;
      this.notify(false);
    };

    try {
      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis speak error:', e);
      return false;
    }
  }

  /**
   * Preview/test the 20yo young girl voice
   */
  public static previewVoice(): Promise<boolean> {
    const sample = 'Привет! Я рада поговорить с тобой вживую. Как твоё настроение сегодня?';
    return this.speak(sample, 'voice-preview', 1.18, 0.98);
  }

  public static stop() {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (_) {}
      this.activeAudio = null;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (_) {}
      this.activeUtterance = null;
    }

    this.currentMessageId = null;
    this.notify(false);
  }

  public static isSpeaking(): boolean {
    const isAudioPlaying = !!this.activeAudio && !this.activeAudio.paused;
    const isSynthPlaying = !!this.synth && this.synth.speaking;
    return isAudioPlaying || isSynthPlaying;
  }
}

export type VoiceSessionStatus = 'idle' | 'listening' | 'processing' | 'speaking_aura' | 'error';

export interface VoiceSessionCallbacks {
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onAutoSend: (text: string) => void;
  onStatusChange: (status: VoiceSessionStatus) => void;
  onError?: (err: string) => void;
}

/**
 * Robust Web Speech API recognition service.
 * Solves browser WebSocket disconnection / hanging after speech synthesis:
 * - Gracefully pauses during Aura's TTS reply so mic doesn't capture assistant's audio
 * - Seamlessly restarts Web Speech API recognition once Aura finishes speaking
 * - Automatically detects silence after speech and sends text to Aura
 * - Reconnects automatically if Chrome terminates the internal speech WebSocket
 */
export class VoiceRecognitionService {
  private static recognition: any = null;
  private static isActiveSession = false;
  private static isPausedForAura = false;
  private static status: VoiceSessionStatus = 'idle';
  private static currentTranscript = '';
  private static silenceTimer: any = null;
  private static reconnectTimer: any = null;
  private static callbacks: VoiceSessionCallbacks | null = null;
  private static removeSpeechListener: (() => void) | null = null;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static getStatus(): VoiceSessionStatus {
    return this.status;
  }

  public static isActive(): boolean {
    return this.isActiveSession;
  }

  public static getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  private static setStatus(newStatus: VoiceSessionStatus) {
    this.status = newStatus;
    this.callbacks?.onStatusChange(newStatus);
  }

  /**
   * Initialize speech synthesis listener to automatically handle pause/resume when Aura speaks
   */
  private static initSpeechListener() {
    if (this.removeSpeechListener) return;

    this.removeSpeechListener = SpeechService.addListener((isPlaying) => {
      if (isPlaying) {
        // Aura started speaking: pause recognition so it doesn't transcribe herself
        this.pauseForAura();
      } else {
        // Aura finished speaking: resume listening if user still has voice session active!
        this.resumeAfterAura();
      }
    });
  }

  /**
   * Start a persistent voice recognition session with auto-send on silence
   */
  public static start(callbacks: VoiceSessionCallbacks): boolean {
    if (!this.isSupported()) {
      callbacks.onError?.('Ваш браузер не поддерживает распознавание речи');
      return false;
    }

    this.callbacks = callbacks;
    this.isActiveSession = true;
    this.isPausedForAura = false;
    this.currentTranscript = '';

    this.initSpeechListener();
    this.startRecognitionInstance();
    return true;
  }

  private static cleanupCurrentInstance() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
  }

  private static startRecognitionInstance() {
    this.cleanupCurrentInstance();

    if (!this.isActiveSession || this.isPausedForAura) {
      return;
    }

    // If speech synthesis or audio is still active, reschedule check instead of terminating
    if (SpeechService.isSpeaking()) {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (this.isActiveSession && !this.isPausedForAura) {
          this.startRecognitionInstance();
        }
      }, 200);
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ru-RU';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.setStatus('listening');
      };

      rec.onresult = (event: any) => {
        if (!this.isActiveSession || this.isPausedForAura) return;

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            if (res.isFinal) {
              finalTranscript += res[0].transcript + ' ';
            } else {
              interimTranscript += res[0].transcript;
            }
          }
        }

        const fullText = (finalTranscript + interimTranscript).trim();
        if (fullText) {
          this.currentTranscript = fullText;
          this.callbacks?.onTranscriptChange(fullText, false);

          // Reset silence timer on every new speech event
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
          }

          // Responsive auto-send after 900ms pause once user finishes phrasing
          this.silenceTimer = setTimeout(() => {
            this.commitAndSendNow();
          }, 900);
        }
      };

      rec.onerror = (e: any) => {
        const error = e.error;
        // Ignore normal no-speech silence or abort events
        if (error === 'no-speech' || error === 'aborted') {
          return;
        }

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.callbacks?.onError?.('Доступ к микрофону заблокирован в браузере');
          this.stop();
          return;
        }

        // For network glitches (internal Chrome speech WebSocket timeouts), schedule auto-reconnect
        if (error === 'network' && this.isActiveSession && !this.isPausedForAura) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (this.isActiveSession && !this.isPausedForAura) {
              this.startRecognitionInstance();
            }
          }, 350);
        }
      };

      rec.onend = () => {
        this.recognition = null;

        // If user already spoke something and Chrome closed the utterance, send immediately!
        if (this.currentTranscript.trim() && this.isActiveSession && !this.isPausedForAura) {
          this.commitAndSendNow();
          return;
        }

        // If session is active and not paused for Aura, restart immediately so walkie-talkie NEVER drops
        if (this.isActiveSession && !this.isPausedForAura && !SpeechService.isSpeaking()) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (this.isActiveSession && !this.isPausedForAura && !SpeechService.isSpeaking()) {
              this.startRecognitionInstance();
            }
          }, 150);
        } else if (!this.isActiveSession) {
          this.setStatus('idle');
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (err) {
      console.warn('Failed to start SpeechRecognition instance:', err);
      if (this.isActiveSession && !this.isPausedForAura) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.startRecognitionInstance();
        }, 400);
      }
    }
  }

  /**
   * Pause recognition while Aura is thinking and voicing her response
   */
  public static pauseForAura() {
    this.isPausedForAura = true;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    if (this.isActiveSession) {
      this.setStatus(SpeechService.isSpeaking() ? 'speaking_aura' : 'processing');
    }
  }

  /**
   * Automatically resume recognition once Aura finishes speaking!
   * Keeps the connection active and ready for the next user input.
   */
  public static resumeAfterAura() {
    if (!this.isActiveSession) return;

    this.isPausedForAura = false;
    this.currentTranscript = '';
    this.callbacks?.onTranscriptChange('', false);

    // Brief 100ms buffer to ensure audio output devices are quiet
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.isActiveSession && !this.isPausedForAura && !SpeechService.isSpeaking()) {
        this.startRecognitionInstance();
      }
    }, 100);
  }

  /**
   * Commit currently transcribed speech immediately and send to Aura
   */
  public static commitAndSendNow(): boolean {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const textToSend = this.currentTranscript.trim();
    if (textToSend) {
      this.currentTranscript = '';
      this.callbacks?.onTranscriptChange('', true);
      this.pauseForAura();
      this.callbacks?.onAutoSend(textToSend);
      return true;
    }
    return false;
  }

  /**
   * Stop voice session completely (user toggled off)
   */
  public static stop() {
    this.isActiveSession = false;
    this.isPausedForAura = false;
    this.currentTranscript = '';
    this.cleanupCurrentInstance();
    this.setStatus('idle');
  }
}

