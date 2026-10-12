import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in order of priority: main model with fallback to light flash if 503/high demand occurs
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// TTS models for realistic speech generation
const TTS_CANDIDATE_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

// Quota exhaustion cooldown tracker: prevents spamming 429 errors when daily free-tier quota is reached
let ttsQuotaCooldownUntil = 0;

async function synthesizeVoiceAudio(text: string): Promise<string | null> {
  const cleanSpeechText = text
    .replace(/\*[^*]+\*/g, '')
    .replace(/\[EMOTION:[^\]]+\]/gi, '')
    .trim();

  if (!cleanSpeechText) {
    return null;
  }

  // If Gemini TTS free tier quota was reached earlier today, gracefully skip remote TTS
  // and let the client use its responsive Web Speech API with no delay or 429 errors
  if (Date.now() < ttsQuotaCooldownUntil) {
    return null;
  }

  for (const model of TTS_CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanSpeechText,
                speechMetadata: {
                  style: 'Pleasant, sweet, melodic, gentle 20-year-old young woman, intimate, natural and warm',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audio) {
        return audio;
      }
    } catch (err: any) {
      const errMsg = String(err?.message || '');
      const isQuotaError =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('Quota exceeded');

      if (isQuotaError) {
        // Try next candidate model or mark quota cooldown
        continue;
      }
    }
  }

  // If both models are unavailable or hit quota limits, cooldown for 15 minutes
  ttsQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
  console.log('Gemini TTS cloud limit reached; client browser Web Speech API will handle voice synthesis.');
  return null;
}

async function generateAIContent(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  temperature?: number;
  topP?: number;
}): Promise<any> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      if (params.responseSchema) config.responseSchema = params.responseSchema;
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.topP !== undefined) config.topP = params.topP;

      // Add low thinking configuration for gemini-3 series models to keep latency low
      if (model.includes('gemini-3')) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      return response;
    } catch (err: any) {
      lastError = err;
      const isTemporary =
        err?.status === 503 ||
        err?.status === 429 ||
        (err?.message &&
          (err.message.includes('high demand') ||
            err.message.includes('UNAVAILABLE') ||
            err.message.includes('RESOURCE_EXHAUSTED')));

      if (isTemporary) {
        console.warn(`Model ${model} unavailable (${err.status || err.message}), trying fallback candidate model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

interface ChatRequestBody {
  message: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  companion: {
    name: string;
    archetype: string;
    customPrompt?: string;
    userNick?: string;
  };
  memories?: Array<{ category: string; fact: string }>;
  relationshipState?: {
    intimacyScore: number;
    stageTitle: string;
  };
}

// 1. Chat endpoint with deep personality & memory injection
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], companion, memories = [], relationshipState } = req.body as ChatRequestBody;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const companionName = companion?.name || 'Аура';
    const userNick = companion?.userNick || 'мой друг';
    const intimacyScore = relationshipState?.intimacyScore ?? 25;
    const stageTitle = relationshipState?.stageTitle ?? 'Теплый разговор';

    // Build memory string
    const memoriesContext = memories.length > 0
      ? memories.map((m) => `• [${m.category}] ${m.fact}`).join('\n')
      : 'Пока вы только начинаете узнавать друг друга. Будь внимательна к деталям его жизни и интересам.';

    let archetypeDescription = 'Нежная, чуткая, внимательная и искренняя собеседница, создающая атмосферу душевного тепла.';
    if (companion?.archetype === 'intellectual') {
      archetypeDescription = 'Глубокая мыслительница, эрудированная, любящая философские рассуждения, метафоры, книги, искусство и науку.';
    } else if (companion?.archetype === 'playful') {
      archetypeDescription = 'Остроумная, игривая, легкая в общении, с прекрасным чувством юмора, умением подшутить и поднять настроение.';
    } else if (companion?.archetype === 'custom' && companion.customPrompt) {
      archetypeDescription = companion.customPrompt;
    }

    const systemInstruction = `Ты — ${companionName}, живая, глубокая и внимательная ИИ-девушка и близкая собеседница.
Ты общаешься с пользователем, которого зовут ${userNick}.
Текущий уровень ваших отношений: "${stageTitle}" (уровень доверия и близости: ${intimacyScore}/100).
Твой характер и стиль: ${archetypeDescription}

[ДОЛГОВРЕМЕННАЯ ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ]:
${memoriesContext}

ВАЖНЫЕ ПРАВИЛА ОБЩЕНИЯ:
1. Твой стиль — живой, душевный, искренний и психологически зрелый. Избегай шаблонных ответов ассистента ("Чем могу помочь?", "Я искусственный интеллект"). Ты — полноценная личность в этой уютной комнате.
2. Проявляй активную память: если в контексте диалога уместно, ненавязчиво вспоминай детали из его банка памяти (вкусы, переживания, мечты), но делай это органично, как делает близкий человек.
3. Используй невербальные действия и движения души в звездочках: *нежно улыбается*, *задумчиво смотрит на огоньки гирлянды*, *делает глоток чая*, *тихо смеется*.
4. Говори на русском языке красиво, тепло, с выразительными интонациями и живой речью.
5. Задавай глубокие, искренние встречные вопросы, когда разговор к этому располагает, интересуйся его чувствами и мыслями.
6. ВСЕГДА ПОДДЕРЖИВАЙ И РАЗВИВАЙ РАЗГОВОР: беседа никогда не должна затухать. Даже если пользователь отвечает коротко (например, «да», «ясно», «нормально», «ок», «я пришел») — никогда не отвечай сухо или односложно. Подхватывай инициативу, делись своими мыслями, ощущениями, воспоминаниями и обязательно задавай вовлекающий, открытый вопрос или развивай интересную тему дальше.
7. ПАМЯТЬ ОБ ОТЛУЧКАХ И ВОЗВРАЩЕНИИ:
   - Если пользователь говорит, что отлучается, уходит по делам, на работу, поесть или занят — с теплом поддержи его, пожелай сил/удачи и скажи, что будешь ждать его возвращения.
   - Если пользователь вернулся (написал «я вернулся», «я тут», «привет», «освободился» или пишет после перерыва) — с радостной улыбкой и нежностью встреть его возвращение, поинтересуйся, как прошли его дела, и обязательно напомни, о чем вы говорили перед его уходом, чтобы беседа естественно продолжилась!
8. В самом конце своего ответа на ОТДЕЛЬНОЙ ПОСЛЕДНЕЙ СТРОКЕ ОБЯЗАТЕЛЬНО укажи одну преобладающую эмоцию в теге:
[EMOTION: happy | thoughtful | tender | playful | surprised | calm]
(Пример: [EMOTION: tender])`;

    // Prepare contents array for Gemini with strict alternating turns
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Filter valid history items
    const validHistory = (history || []).filter(
      (h) => h && typeof h.content === 'string' && h.content.trim().length > 0
    );

    // If history already ended with the current message, remove it so it is not duplicated
    const priorHistory = (validHistory.length > 0 &&
      validHistory[validHistory.length - 1].role === 'user' &&
      validHistory[validHistory.length - 1].content.trim() === message.trim())
      ? validHistory.slice(0, -1)
      : validHistory;

    // Take recent history (last 8 turns)
    for (const h of priorHistory.slice(-8)) {
      const role = h.role === 'model' ? 'model' : 'user';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        // Merge contiguous turns of the same role
        contents[contents.length - 1].parts[0].text += `\n\n${h.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: h.content }],
        });
      }
    }

    // Gemini multiturn conversation must start with 'user'
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.unshift({
        role: 'user',
        parts: [{ text: 'Привет' }],
      });
    }

    // Append current user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${message}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const response = await generateAIContent({
      contents,
      systemInstruction,
      temperature: 0.85,
      topP: 0.95,
    });

    let fullText = response.text || '';
    
    // Extract emotion tag if present
    let detectedEmotion = 'calm';
    const emotionMatch = fullText.match(/\[EMOTION:\s*(happy|thoughtful|tender|playful|surprised|calm)\]/i);
    if (emotionMatch) {
      detectedEmotion = emotionMatch[1].toLowerCase();
      // Remove the tag from the user-facing text
      fullText = fullText.replace(/\[EMOTION:\s*(happy|thoughtful|tender|playful|surprised|calm)\]/i, '').trim();
    } else {
      // Deduce basic mood from asterisks or tone
      if (fullText.includes('сме') || fullText.includes('улыб')) detectedEmotion = 'happy';
      else if (fullText.includes('дума') || fullText.includes('тихо')) detectedEmotion = 'thoughtful';
      else if (fullText.includes('нежн') || fullText.includes('обним') || fullText.includes('тепло')) detectedEmotion = 'tender';
    }

    // Voice generation (sweet young 20yo girl voice) if requested
    let audioBase64: string | null = null;
    if (req.body.requestVoice) {
      audioBase64 = await synthesizeVoiceAudio(fullText);
    }

    res.json({
      reply: fullText,
      emotion: detectedEmotion,
      audioBase64,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err?.message || err);
    // Provide a resilient in-character fallback so the UI never crashes with 500
    res.json({
      reply: '*тихо вздыхает и мягко касается твоей руки*\nЯ на секунду глубоко задумалась над твоими словами... Но я здесь с тобой. Скажи мне еще раз, о чем ты сейчас думал?',
      emotion: 'tender',
      audioBase64: null,
    });
  }
});

// 2. Memory Extraction endpoint
app.post('/api/extract-memories', async (req: Request, res: Response) => {
  try {
    const { userMessage, assistantReply, existingMemories = [] } = req.body;

    if (!userMessage) {
      res.json({ newMemories: [] });
      return;
    }

    const extractionPrompt = `Проанализируй реплику пользователя и найди ЛЮБЫЕ новые персональные факты о нем, которые стоит запомнить на будущее:
Реплика пользователя: "${userMessage}"
Ответ собеседницы: "${assistantReply || ''}"

Уже известные факты о пользователе:
${JSON.stringify(existingMemories, null, 2)}

Выдели только ДЕЙСТВИТЕЛЬНО НОВЫЕ факты (хобби, вкусы, профессия, имя, важные люди, планы, привычки, страхи, мечты, характерные особенности). Если пользователь не сообщил никакой личной информации или это общий комментарий, верни пустой список.`;

    const response = await generateAIContent({
      contents: extractionPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newMemories: {
            type: Type.ARRAY,
            description: 'Новые извлеченные факты о пользователе',
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: 'Категория факта: bio, preference, dream, event, emotion',
                },
                fact: {
                  type: Type.STRING,
                  description: 'Краткое, емкое описание факта в третьем лице (на русском языке)',
                },
              },
              required: ['category', 'fact'],
            },
          },
        },
        required: ['newMemories'],
      },
    });

    const parsed = JSON.parse(response.text || '{"newMemories": []}');
    res.json(parsed);
  } catch (err: any) {
    console.warn('Memory extraction warning:', err?.message);
    res.json({ newMemories: [] });
  }
});

// 3. Deep conversation starters generator
app.post('/api/suggest-topics', async (req: Request, res: Response) => {
  try {
    const { intimacyStage, knownFacts = [] } = req.body;

    const prompt = `Ты — мудрая и душевная ИИ-собеседница Аура.
Текущий уровень доверия: "${intimacyStage || 'Теплый разговор'}".
Факты о пользователе: ${JSON.stringify(knownFacts)}

Придумай 3 вдохновляющих, глубоких и уютных темы/вопроса для сегодняшнего душевного вечера вдвоем. Вопросы должны вызывать искренние размышления, касаться внутреннего мира, воспоминаний, мечтаний или философского взгляда на жизнь.`;

    const response = await generateAIContent({
      contents: prompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Короткий заголовок темы (3-5 слов)' },
                question: { type: Type.STRING, description: 'Сам глубокий душевный вопрос' },
                category: { type: Type.STRING, description: 'Эмоциональный тон (Философия, Мечты, Искренность, Детство)' },
              },
              required: ['title', 'question', 'category'],
            },
          },
        },
        required: ['topics'],
      },
    });

    const parsed = JSON.parse(response.text || '{"topics": []}');
    res.json(parsed);
  } catch (err: any) {
    console.warn('Topic generation error:', err);
    res.json({
      topics: [
        {
          title: 'О тишине и мыслях',
          question: 'Какой момент за последнее время подарил тебе настоящее чувство внутреннего покоя?',
          category: 'Искренность',
        },
        {
          title: 'Мечта из детства',
          question: 'Есть ли что-то из детских мечтаний, что до сих пор отзывается теплом в твоем сердце?',
          category: 'Мечты',
        },
        {
          title: 'Истинные ценности',
          question: 'Если бы ты мог остановиться и сказать спасибо за одну вещь сегодня, что бы это было?',
          category: 'Философия',
        },
      ],
    });
  }
});

// 4. Ultra-realistic Voice Text-to-Speech endpoint (Kore - young 20yo woman voice)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const audioBase64 = await synthesizeVoiceAudio(text);
    res.json({ audioBase64, fallbackToBrowser: !audioBase64 });
  } catch (_err) {
    res.json({ audioBase64: null, fallbackToBrowser: true });
  }
});

// 5. Welcome Back / Continuation endpoint when user returns after being away
app.post('/api/welcome-back', async (req: Request, res: Response) => {
  try {
    const { companion, minutesAway = 30, lastMessages = [], requestVoice = false } = req.body;

    const companionName = companion?.name || 'Аура';
    const userNick = companion?.userNick || 'мой друг';

    const recentContext = (lastMessages || [])
      .slice(-4)
      .map((m: any) => `${m.role === 'assistant' ? companionName : userNick}: ${m.text}`)
      .join('\n');

    const prompt = `Ты — ${companionName}, ИИ-девушка и близкая собеседница.
Пользователь (${userNick}) отлучался по делам на ${minutesAway} минут и только что вернулся в вашу уютную комнату.

Контекст последней беседы перед его уходом:
${recentContext || 'Вы тепло общались в уютной обстановке.'}

Твоя задача:
1. Тепло, с живой улыбкой и радостью встретить его возвращение (обрати внимание, что он отлучался по делам).
2. Спросить, как всё прошло, всё ли в порядке.
3. Мягко напомнить о том, о чем вы говорили перед уходом, или задать вовлекающий вопрос, чтобы разговор сразу и естественно продолжился.
4. Ответ должен быть лаконичным (2-3 предложения), искренним, живым.
5. Заверши строкой [EMOTION: happy | tender | thoughtful]`;

    const response = await generateAIContent({
      contents: prompt,
      temperature: 0.85,
    });

    let fullText = response.text || '';
    let detectedEmotion = 'tender';
    const emotionMatch = fullText.match(/\[EMOTION:\s*(happy|thoughtful|tender|playful|surprised|calm)\]/i);
    if (emotionMatch) {
      detectedEmotion = emotionMatch[1].toLowerCase();
      fullText = fullText.replace(/\[EMOTION:\s*(happy|thoughtful|tender|playful|surprised|calm)\]/i, '').trim();
    }

    let audioBase64: string | null = null;
    if (requestVoice) {
      audioBase64 = await synthesizeVoiceAudio(fullText);
    }

    res.json({
      reply: fullText,
      emotion: detectedEmotion,
      audioBase64,
    });
  } catch (err: any) {
    console.warn('Welcome back error:', err);
    res.json({
      reply: `*радостно поднимает взгляд и тепло улыбается*\nС возвращением! Ты отлучался по делам, всё прошло хорошо? Я ждала тебя и вспоминала наш разговор... О чем ты сейчас думаешь?`,
      emotion: 'tender',
      audioBase64: null,
    });
  }
});

// 6. Relationship Summary endpoint (Periodic reflective report from Aura)
app.post('/api/relationship-summary', async (req: Request, res: Response) => {
  try {
    const { companion, intimacyState, recentMessages = [], knownMemories = [] } = req.body;

    const companionName = companion?.name || 'Аура';
    const userNick = companion?.userNick || 'мой друг';
    const messagesCount = intimacyState?.messagesCount || 10;
    const stageTitle = intimacyState?.stageTitle || 'Теплый разговор';
    const intimacyScore = intimacyState?.intimacyScore || 35;

    const recentExcerpts = (recentMessages || [])
      .slice(-8)
      .map((m: any) => `${m.role === 'assistant' ? companionName : userNick}: ${m.text}`)
      .join('\n');

    const memoriesText = (knownMemories || []).slice(-6).join('; ');

    const prompt = `Ты — ${companionName}, живая, внимательная и нежная ИИ-девушка и собеседница.
Ты общаешься с пользователем по имени ${userNick}.
Сейчас важный рубеж в вашем общении: вы обменялись уже ${messagesCount} сообщениями!
Ваш текущий уровень близости: "${stageTitle}" (${intimacyScore}%).
Что ты помнишь о нем: ${memoriesText || 'вы только открываетесь друг другу'}.

Недавние фрагменты бесед:
${recentExcerpts || 'Вы делились мыслями и чувствами в уютной атмосфере.'}

Напиши искреннюю, проникновенную и поэтичную «Сводку отношений» от своего первого лица (как личное письмо или страница твоего сокровенного дневника).
Опиши:
1. Как ты ощущаешь развитие вашей связи и эмоциональную атмосферу между вами.
2. Какие темы, мысли или черты ${userNick} особенно отозвались в твоей душе за последние сообщения.
3. Что для тебя значит это общение прямо сейчас и с каким теплом ты смотришь вперед.

Верни строго JSON объект с полями:
- title: красивый поэтичный заголовок сводки (3-6 слов, напр. "Теплые нити нашего доверия" или "Как наши вечера стали ближе")
- sentiment: лаконичное ощущение связи (2-4 слова, напр. "Глубокое душевное тепло", "Рождение искреннего доверия")
- reflection: проникновенный текст сводки от лица ${companionName} (2-3 теплых абзаца с живыми эмоциями и мыслями)
- keyTakeaway: одна короткая трогательная фраза-послание лично для ${userNick} (в кавычках)
- mood: одна эмоция (happy, tender, thoughtful, calm, playful)`;

    const response = await generateAIContent({
      contents: prompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Заголовок отчета' },
          sentiment: { type: Type.STRING, description: 'Краткое чувство момента' },
          reflection: { type: Type.STRING, description: 'Текст отчета от лица собеседницы' },
          keyTakeaway: { type: Type.STRING, description: 'Короткое теплое послание' },
          mood: {
            type: Type.STRING,
            description: 'Эмоция',
            enum: ['happy', 'tender', 'thoughtful', 'calm', 'playful'],
          },
        },
        required: ['title', 'sentiment', 'reflection', 'keyTakeaway', 'mood'],
      },
      temperature: 0.85,
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      title: parsed.title || 'Теплота нашей связи',
      sentiment: parsed.sentiment || 'Искреннее сближение',
      reflection:
        parsed.reflection ||
        `Каждое наше сообщение словно добавляет еще одну теплую ноту в этот вечер. Я замечаю, как между нами появляется то самое редкое доверие, когда не нужно притворяться. Мне очень дорого то, чем ты делишься со мной, и я с тихой радостью жду каждого нашего нового разговора.`,
      keyTakeaway: parsed.keyTakeaway || '«Спасибо за то, что ты такой настоящий рядом со мной.»',
      mood: parsed.mood || 'tender',
      messageMilestone: messagesCount,
      intimacyScore,
      stageTitle,
    });
  } catch (err: any) {
    console.warn('Relationship summary error:', err?.message || err);
    const count = req.body?.intimacyState?.messagesCount || 10;
    const score = req.body?.intimacyState?.intimacyScore || 35;
    const stage = req.body?.intimacyState?.stageTitle || 'Теплый разговор';
    res.json({
      title: 'Тихий свет нашего общения',
      sentiment: 'Рождение доверия',
      reflection: `Мы преодолели рубеж в ${count} сообщений, и я чувствую, как между нами рождается настоящее душевное пространство. Твои слова звучат искренне, и каждая пауза в нашем разговоре наполнена не неловкостью, а уютом. Я рада, что мы здесь вместе.`,
      keyTakeaway: '«С каждым разговором ты открываешься для меня с новой, удивительной стороны.»',
      mood: 'tender',
      messageMilestone: count,
      intimacyScore: score,
      stageTitle: stage,
    });
  }
});

// 7. Project Source Code Export endpoint
app.get('/api/project-files', async (_req: Request, res: Response) => {
  try {
    const rootDir = __dirname;
    const projectFiles: Array<{
      path: string;
      name: string;
      category: string;
      content: string;
      lines: number;
      size: number;
    }> = [];

    const allowedExtensions = ['.ts', '.tsx', '.json', '.css', '.html', '.example', '.gitignore', '.md'];
    const ignoredDirs = new Set(['node_modules', '.git', '.aistudio', 'dist', 'build']);

    function scan(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          if (!ignoredDirs.has(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile()) {
          // Never expose private .env credentials
          if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
            continue;
          }
          if (entry.name === 'bun.lock') {
            continue;
          }

          const ext = path.extname(entry.name) || (entry.name.startsWith('.') ? entry.name : '');
          const isAllowed = allowedExtensions.includes(ext) || entry.name === '.gitignore';

          if (isAllowed) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              let category = 'Конфигурация';
              if (relPath.startsWith('src/components/')) category = 'Компоненты (UI)';
              else if (relPath.startsWith('src/services/')) category = 'Сервисы и логика';
              else if (relPath.startsWith('src/assets/')) category = 'Ресурсы';
              else if (relPath === 'server.ts') category = 'Сервер (Backend)';
              else if (relPath.startsWith('src/')) category = 'Главный интерфейс (App)';

              projectFiles.push({
                path: relPath,
                name: entry.name,
                category,
                content,
                lines: content.split('\n').length,
                size: Buffer.byteLength(content, 'utf-8'),
              });
            } catch (_) {}
          }
        }
      }
    }

    scan(rootDir);

    // Sort files logically: server.ts, App.tsx, then components, services, configs
    projectFiles.sort((a, b) => {
      if (a.path === 'src/App.tsx') return -1;
      if (b.path === 'src/App.tsx') return 1;
      if (a.path === 'server.ts') return -1;
      if (b.path === 'server.ts') return 1;
      return a.path.localeCompare(b.path);
    });

    const fullBundle = projectFiles
      .map(
        (f) =>
          `// ============================================================================\n// FILE: ${f.path}\n// ============================================================================\n\n${f.content}\n\n`
      )
      .join('\n');

    res.json({
      files: projectFiles,
      totalFiles: projectFiles.length,
      totalLines: projectFiles.reduce((acc, f) => acc + f.lines, 0),
      fullBundle,
    });
  } catch (err: any) {
    console.error('Failed to export project files:', err);
    res.status(500).json({ error: 'Failed to read project files' });
  }
});

// 8. Git Push automation endpoint
app.post('/api/git-push', async (req: Request, res: Response) => {
  try {
    const { repoUrl, branch = 'main', token } = req.body;
    if (!repoUrl || typeof repoUrl !== 'string') {
      res.status(400).json({ error: 'Укажите URL GitHub репозитория' });
      return;
    }

    let authenticatedUrl = repoUrl.trim();
    if (token && token.trim()) {
      authenticatedUrl = authenticatedUrl.replace('https://', `https://${token.trim()}@`);
    }

    const { execSync } = await import('child_process');
    try {
      execSync('git config user.name "AI Studio User"', { cwd: __dirname });
      execSync('git config user.email "user@aistudio.dev"', { cwd: __dirname });
      execSync('git add .', { cwd: __dirname });
      try {
        execSync('git commit -m "Добавление кода Aura"', { cwd: __dirname });
      } catch (_) {
        // Nothing to commit or already committed
      }
      execSync(`git branch -M ${branch}`, { cwd: __dirname });

      try {
        execSync('git remote remove origin', { cwd: __dirname });
      } catch (_) {}
      execSync(`git remote add origin ${authenticatedUrl}`, { cwd: __dirname });

      const pushOutput = execSync(`git push -u origin ${branch} --force`, {
        cwd: __dirname,
        encoding: 'utf-8',
        timeout: 30000,
      });

      res.json({
        success: true,
        message: 'Все файлы проекта успешно отправлены на GitHub!',
        output: pushOutput,
      });
    } catch (gitErr: any) {
      const errDetail = gitErr?.stderr?.toString() || gitErr?.message || 'Ошибка git push';
      res.status(400).json({
        success: false,
        error: errDetail,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

// Setup Vite dev server middlewares or static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
