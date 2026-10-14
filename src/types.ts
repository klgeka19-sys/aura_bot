export type EmotionType = 'calm' | 'happy' | 'thoughtful' | 'tender' | 'playful' | 'surprised';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  emotion?: EmotionType;
  generatedImageUrl?: string;
  generatedImagePrompt?: string;
  isGeneratingImage?: boolean;
}

export interface ChatWallpaper {
  id: string;
  name: string;
  url: string;
  opacity: number; // 0.1 to 0.9 (e.g. 0.35)
  blur: number; // 0 to 12
  isCustom?: boolean;
}

export type Archetype = 'caring' | 'intellectual' | 'playful' | 'custom';

export interface CompanionProfile {
  name: string;
  archetype: Archetype;
  customPrompt: string;
  userNick: string;
  voicePitch: number;
  voiceRate: number;
  autoSpeak: boolean;
  avatarUrl?: string;
}

export interface AvatarOption {
  id: string;
  name: string;
  description: string;
  url: string;
  styleTag: string;
  category: 'anime' | 'realistic';
  hasLiveMotion?: boolean;
}

export type RealisticAvatarOption = AvatarOption;

export interface MemoryFact {
  id: string;
  category: 'bio' | 'preference' | 'dream' | 'event' | 'emotion';
  fact: string;
  timestamp: number;
  source: 'auto' | 'manual';
}

export interface RelationshipState {
  intimacyScore: number; // 0 - 100
  stageTitle: string;
  level: number;
  messagesCount: number;
}

export interface RelationshipSummary {
  id: string;
  timestamp: number;
  messageMilestone: number;
  intimacyScore: number;
  stageTitle: string;
  title: string;
  sentiment: string;
  reflection: string;
  keyTakeaway: string;
  mood: EmotionType;
}

export interface DeepTopic {
  title: string;
  question: string;
  category: string;
}

export type AmbientLighting = 'cozy_evening' | 'candlelight' | 'twilight_blue';

export type ConversationMode = 'text' | 'live';

export type MicPermissionState = 'prompt' | 'granted' | 'denied';
