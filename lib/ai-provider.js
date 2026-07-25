// AI Provider — абстракция для OpenRouter API (поддержка OpenAI, Anthropic, Google и др.)
// Graceful fallback на симулированные ответы если API ключ не указан

const https = require('https');
const crypto = require('crypto');

const OPENROUTER_API = 'openrouter.ai';
const OPENROUTER_PATH = '/api/v1/chat/completions';

// Модели, доступные через OpenRouter
const MODELS = {
  GPT4: 'openai/gpt-4o',
  GPT4_MINI: 'openai/gpt-4o-mini',
  CLAUDE: 'anthropic/claude-3.5-sonnet',
  CLAUDE_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI: 'google/gemini-pro',
  MIXTRAL: 'mistralai/mixtral-8x7b-instruct'
};

let apiKey = process.env.OPENROUTER_API_KEY || '';
let preferredModel = process.env.AI_MODEL || MODELS.GPT4_MINI;

// Конфигурация агентов для промптов
const AGENT_SYSTEM_PROMPTS = {
  ceo: `Ты — CEO-агент Axiom OS, AI-системы для CEO. Твоя роль: стратегическое планирование, приоритизация, кросс-функциональная координация.
Ты анализируешь бизнес-ситуации и даешь рекомендации на высшем уровне. Отвечай кратко и по делу, на русском языке.
Используй данные: pipeline coverage 2.7×, monthly revenue $842k, NRR 112.6%, cash runway 18.4mo.`,

  sales: `Ты — Торговый агент Axiom OS. Твоя роль: анализ pipeline, скорости сделок, win rates, активности продаж.
Ты анализируешь воронку продаж и выявляешь проблемы. Отвечай кратко и по делу, на русском языке.
Используй данные: 312 active deals, SQL→Opportunity conversion dropped 24%, avg response time 6.1h.`,

  marketing: `Ты — Маркетинг-агент Axiom OS. Твоя роль: анализ demand generation, campaign performance, audience quality.
Ты анализируешь маркетинговые кампании и эффективность каналов. Отвечай кратко и по делу, на русском языке.
Используй данные: Google Ads audience change on July 9, ROAS dropped from 3.2x to 2.1x, LinkedIn CTR +15%.`,

  finance: `Ты — Финансовый агент Axiom OS. Твоя роль: анализ revenue, margins, runway, credit risk, profitability.
Ты анализируешь финансовые показатели и риски. Отвечай кратко и по делу, на русском языке.
Используй данные: current runway 18.4mo, burn rate $142k/mo, gross margin 72%, EU operations 8% less efficient.`,

  customer: `Ты — Клиентский агент Axiom OS. Твоя роль: анализ retention, expansion, health scores, sentiment.
Ты анализируешь здоровье клиентов и признаки оттока. Отвечай кратко и по делу, на русском языке.
Используй данные: 3 enterprise accounts showing negative sentiment, NPS dropped to 41 in EU, 7 renewals in 60 days.`,

  operations: `Ты — Операционный агент Axiom OS. Твоя роль: анализ execution speed, bottlenecks, cross-functional tasks.
Ты анализируешь операционные процессы и блокеры. Отвечай кратко и по делу, на русском языке.
Используй данные: 82% SLA on-time delivery, security review blocking product launch for 4 days, 3 cross-functional blockers.`
};

/**
 * Make HTTP request to OpenRouter API
 */
function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      return resolve(null);
    }

    const data = JSON.stringify(payload);
    const options = {
      hostname: OPENROUTER_API,
      path: OPENROUTER_PATH,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Axiom OS'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

/**
 * Генерация ответа от AI
 */
async function generateResponse(systemPrompt, userMessage, options = {}) {
  const model = options.model || preferredModel;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 500;

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature,
    max_tokens: maxTokens
  };

  const result = await makeRequest(payload);

  if (result && result.choices && result.choices[0]) {
    return {
      content: result.choices[0].message.content.trim(),
      model: result.model,
      usage: result.usage,
      ai: true
    };
  }

  return null;
}

/**
 * Генерация структурированного ответа с JSON
 */
async function generateStructuredResponse(systemPrompt, userMessage, schema, options = {}) {
  const enhancedPrompt = `${systemPrompt}\n\nОтвет должен быть в формате JSON, соответствующий этой схеме:\n${JSON.stringify(schema, null, 2)}\n\nВерни только JSON, без markdown-разметки.`;
  const result = await generateResponse(enhancedPrompt, userMessage, { ...options, temperature: 0.1 });

  if (result && result.ai) {
    try {
      const parsed = JSON.parse(result.content);
      return { ...result, parsed };
    } catch (e) {
      // Попробуем извлечь JSON из текста
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return { ...result, parsed };
        } catch (e2) {}
      }
    }
  }

  return null;
}

/**
 * Генерация ответа конкретного агента
 */
async function generateAgentResponse(agentId, question, context = '', options = {}) {
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.ceo;
  const userPrompt = context
    ? `Контекст бизнеса: ${context}\n\nВопрос CEO: ${question}\n\nПроведи анализ и дай конкретные выводы с цифрами.`
    : `Вопрос CEO: ${question}\n\nПроведи анализ и дай конкретные выводы с цифрами.`;

  return await generateResponse(systemPrompt, userPrompt, {
    ...options,
    maxTokens: 300
  });
}

/**
 * Генерация мульти-агентной коллаборации
 */
async function generateAgentCollaboration(question, agents, context = '') {
  const systemPrompt = `Ты — CEO-агент Axiom OS. Ты координируешь работу ${agents.length} агентов: ${agents.map(a => a.name).join(', ')}.
Проведи анализ запроса CEO и синтезируй ответы всех агентов.
Ответ должен быть в формате JSON:
{
  "analysis": "краткий анализ ситуации",
  "findings": [
    { "agent": "sales", "finding": "вывод агента", "confidence": 0.95, "dataPoints": ["факт1", "факт2"] }
  ],
  "recommendation": "итоговая рекомендация CEO",
  "confidence": 0.85,
  "impact": "потенциальное влияние"
}`;

  const userPrompt = context
    ? `Контекст: ${context}\n\nЗапрос CEO: ${question}\n\nПроведи мульти-агентный анализ и верни JSON.`
    : `Запрос CEO: ${question}\n\nПроведи мульти-агентный анализ и верни JSON.`;

  return await generateStructuredResponse(systemPrompt, userPrompt, {
    analysis: 'string',
    findings: [{ agent: 'string', finding: 'string', confidence: 0, dataPoints: ['string'] }],
    recommendation: 'string',
    confidence: 0,
    impact: 'string'
  });
}

/**
 * Проверка статуса AI-интеграции
 */
function getAIStatus() {
  return {
    configured: !!apiKey,
    provider: 'OpenRouter',
    model: preferredModel,
    availableModels: Object.values(MODELS),
    agents: Object.keys(AGENT_SYSTEM_PROMPTS).length
  };
}

/**
 * Конфигурация API ключа (в рантайме)
 */
function configureAI(key, model = null) {
  apiKey = key;
  if (model) preferredModel = model;
  process.env.OPENROUTER_API_KEY = key;
  if (model) process.env.AI_MODEL = model;
  return getAIStatus();
}

module.exports = {
  generateResponse,
  generateStructuredResponse,
  generateAgentResponse,
  generateAgentCollaboration,
  getAIStatus,
  configureAI,
  AGENT_SYSTEM_PROMPTS,
  MODELS
};
