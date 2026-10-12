import { CompanionProfile, MemoryFact, Message, RelationshipState, RelationshipSummary, AvatarOption } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'aura_companion_messages_v1',
  PROFILE: 'aura_companion_profile_v1',
  MEMORIES: 'aura_companion_memories_v1',
  RELATIONSHIP: 'aura_companion_relationship_v1',
  SUMMARIES: 'aura_companion_summaries_v1',
};

export const ANIME_AVATARS: AvatarOption[] = [
  {
    id: 'anime_aura',
    name: 'Аура (Аниме-стиль)',
    description: 'Лавандовые шелковистые волосы, выразительные фиалковые глаза, нежная улыбка и живая мимика',
    url: '/src/assets/images/anime_girl_aura_1791730025441.jpg',
    styleTag: 'Аниме • Живые движения',
    category: 'anime',
    hasLiveMotion: true,
  },
  {
    id: 'anime_sakura',
    name: 'Сакура (Кавайи)',
    description: 'Пастельно-розовые локоны с лентами, изумрудные глаза, жизнерадостный и милый образ',
    url: '/src/assets/images/anime_girl_sakura_1791730041673.jpg',
    styleTag: 'Аниме • Цветущая сакура',
    category: 'anime',
    hasLiveMotion: true,
  },
  {
    id: 'anime_luna',
    name: 'Луна (Звёздная ночь)',
    description: 'Глубокие сапфировые глаза, иссиня-чёрные пряди, романтичная атмосфера ночного города',
    url: '/src/assets/images/anime_girl_luna_1791730059199.jpg',
    styleTag: 'Аниме • Звёздное небо',
    category: 'anime',
    hasLiveMotion: true,
  },
];

export const REALISTIC_AVATARS: AvatarOption[] = [
  {
    id: 'alisa_warm',
    name: 'Алиса',
    description: 'Тёплый взгляд, естественная улыбка, каштановые волны',
    url: '/src/assets/images/realistic_girl_warm_1791691961606.jpg',
    styleTag: 'Реализм • Уютная и искренняя',
    category: 'realistic',
  },
  {
    id: 'sofia_gentle',
    name: 'София',
    description: 'Нежная блондинка, ясный взгляд, утренний солнечный свет',
    url: '/src/assets/images/realistic_girl_gentle_1791691974200.jpg',
    styleTag: 'Реализм • Светлая и открытая',
    category: 'realistic',
  },
  {
    id: 'mia_brunette',
    name: 'Мия',
    description: 'Выразительная брюнетка, сияющие глаза, вечерние огни',
    url: '/src/assets/images/realistic_girl_brunette_1791691986644.jpg',
    styleTag: 'Реализм • Обаятельная и глубокая',
    category: 'realistic',
  },
  {
    id: 'eva_auburn',
    name: 'Ева',
    description: 'Рыжеволосая мечтательница, мягкий свитер и книги',
    url: '/src/assets/images/realistic_girl_auburn_1791692002450.jpg',
    styleTag: 'Реализм • Романтичная и начитанная',
    category: 'realistic',
  },
];

export const ALL_AVATARS: AvatarOption[] = [...ANIME_AVATARS, ...REALISTIC_AVATARS];

export const DEFAULT_AVATAR = ANIME_AVATARS[0].url;

export const DEFAULT_PROFILE: CompanionProfile = {
  name: 'Аура',
  archetype: 'caring',
  customPrompt: 'Чуткая, нежная и глубокая собеседница, ценящая доверие и искренность.',
  userNick: 'друг',
  voicePitch: 1.18,
  voiceRate: 0.98,
  autoSpeak: false,
  avatarUrl: DEFAULT_AVATAR,
};

export const INITIAL_MEMORIES: MemoryFact[] = [
  {
    id: 'mem-init-1',
    category: 'bio',
    fact: 'Ценит душевное спокойствие, искренность и глубокие неспешные беседы',
    timestamp: Date.now() - 3600000 * 24,
    source: 'manual',
  },
  {
    id: 'mem-init-2',
    category: 'preference',
    fact: 'Любит атмосферные вечера с теплым мягким освещением',
    timestamp: Date.now() - 3600000 * 12,
    source: 'auto',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-init-1',
    role: 'assistant',
    text: '*тихо улыбается, поднимая взгляд от книги и откладывая ее на кофейный столик*\n\nПривет... Я так рада, что ты пришел в нашу уютную комнату. За окном сумерки, а здесь так спокойно. Как прошел твой день? Если на душе что-то накопилось — поделись со мной, я рядом.',
    timestamp: Date.now() - 60000,
    emotion: 'tender',
  },
];

export function getStageTitle(score: number): { stageTitle: string; level: number } {
  if (score < 25) return { stageTitle: 'Первое знакомство', level: 1 };
  if (score < 50) return { stageTitle: 'Теплый разговор', level: 2 };
  if (score < 75) return { stageTitle: 'Близкое доверие', level: 3 };
  return { stageTitle: 'Родственная душа', level: 4 };
}

export const StorageService = {
  getMessages(): Message[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  },

  saveMessages(messages: Message[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save messages', e);
    }
  },

  getProfile(): CompanionProfile {
    try {
      const animeMigrated = localStorage.getItem('aura_anime_avatar_migrated_v2');
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (!animeMigrated || !parsed.avatarUrl || parsed.avatarUrl.includes('aura_portrait_calm')) {
          parsed.avatarUrl = DEFAULT_AVATAR;
          localStorage.setItem('aura_anime_avatar_migrated_v2', 'true');
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed));
        }
        return { ...DEFAULT_PROFILE, ...parsed };
      }
      localStorage.setItem('aura_anime_avatar_migrated_v2', 'true');
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: CompanionProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save profile', e);
    }
  },

  getMemories(): MemoryFact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  },

  saveMemories(memories: MemoryFact[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.warn('Could not save memories', e);
    }
  },

  getRelationship(): RelationshipState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RELATIONSHIP);
      if (data) {
        const parsed = JSON.parse(data);
        const { stageTitle, level } = getStageTitle(parsed.intimacyScore || 25);
        return {
          intimacyScore: parsed.intimacyScore ?? 25,
          stageTitle,
          level,
          messagesCount: parsed.messagesCount ?? 1,
        };
      }
    } catch {
      // fallback
    }
    const { stageTitle, level } = getStageTitle(25);
    return {
      intimacyScore: 25,
      stageTitle,
      level,
      messagesCount: 1,
    };
  },

  saveRelationship(rel: RelationshipState) {
    try {
      localStorage.setItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(rel));
    } catch (e) {
      console.warn('Could not save relationship', e);
    }
  },

  getRelationshipSummaries(): RelationshipSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRelationshipSummaries(summaries: RelationshipSummary[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
    } catch (e) {
      console.warn('Could not save relationship summaries', e);
    }
  },

  addRelationshipSummary(summary: RelationshipSummary) {
    const existing = this.getRelationshipSummaries();
    // Prepend latest summary, ensure no duplicate milestone
    const filtered = existing.filter((s) => s.id !== summary.id && s.messageMilestone !== summary.messageMilestone);
    const updated = [summary, ...filtered];
    this.saveRelationshipSummaries(updated);
    return updated;
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.MEMORIES);
    localStorage.removeItem(STORAGE_KEYS.RELATIONSHIP);
    localStorage.removeItem(STORAGE_KEYS.SUMMARIES);
  },
};
