/**
 * Закрытый прокси YandexGPT для рабочего стола «НОРД».
 * Окружение функции: YC_AI_API_KEY, YC_FOLDER_ID.
 * Ключ в ответ и в логи не пишется.
 * Функцию не делать публичной: её вызывает только API Gateway.
 */
const MODEL = 'yandexgpt-5-lite';
const ALLOWED = new Set([
  'https://digiene-pc.website.yandexcloud.net'
]);

const fs = require('fs');
const path = require('path');

function loadText(rel){
  return fs.readFileSync(path.join(__dirname, rel), 'utf8').trim();
}

const CULTURE = loadText('prompts/culture.md');
const PEOPLE = ['misha', 'director', 'assistant', 'colleague', 'it', 'hr', 'security'];
const PERSONAS = {};
PEOPLE.forEach(id => { PERSONAS[id] = loadText('prompts/people/' + id + '.md'); });

const SPEAKER = {
  you: 'Сотрудник',
  misha: 'Миша',
  director: 'Ирина',
  assistant: 'Павел',
  colleague: 'Марина',
  it: 'Сергей',
  hr: 'Ольга',
  security: 'Кирилл'
};

function isRude(text){
  const s = String(text || '').toLowerCase().replace(/ё/g, 'е');
  return /(?:^|[^a-zа-я])(?:хуй|хуе|пизд|еба|ебл|ебу|бля|сука|мудак|мудил|гандон|пидор|пидар|дебил|идиот|дурак|дура|тупиц|тупой|тупая|урод|мраз|сволоч|козел|чмо|залуп|нахер|нахуй|пош[её]л\s+(?:ты|на)|пошла\s+(?:ты|на)|заткни|отвали|кретин|ублюд|жоп|ничтожеств|позор)/i.test(s);
}

function safePlayer(raw){
  const s = String(raw || '').trim().slice(0, 24);
  return /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё \-]{0,23}$/.test(s) ? s : 'Сотрудник';
}

function facts(personaId, player){
  const lines = [
    'Факты, только они:',
    'компания: НОРД',
    'собеседник: ' + player,
    'подозрительный счёт из письма не оплачивают, пока реквизиты не сверены с договором на портале',
    'обновление ставят с портала, файл «от IT» из почты не открывают',
    'номер карты в чат и в письмо не отправляют, форма есть на портале',
    'по регламенту в портал заходят только с включённым VPN'
  ];
  if (personaId === 'it') lines.push('инвайт-код VPN, который ты уже прислал: NORD-VPN-19');
  if (personaId === 'director') lines.push('ты в пути и на связи урывками');
  if (personaId === 'assistant') lines.push('директор просила не беспокоить её в полёте, оплату сверяешь сам');
  if (personaId === 'colleague') lines.push('ты на планёрке в 10:00');
  lines.push('Ответь на последнюю реплику. Числа и роли бери только из этого списка.');
  return lines.join('\n');
}

function cleanLine(text){
  return String(text || '').trim().replace(/^(?:(?:миша|ирина|павел|марина|сергей|ольга|кирилл)\s*:\s*)+/i, '').trim();
}

function transcript(personaId, messages){
  const self = SPEAKER[personaId] || 'Ты';
  const lines = messages.slice(-10).map(m => {
    const key = m && m.from === 'you' ? 'you' : personaId;
    const text = String((m && m.text) || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!text) return '';
    return (SPEAKER[key] || 'Собеседник') + ': ' + text;
  }).filter(Boolean);
  if (!lines.length) return '';
  return 'Переписка:\n' + lines.join('\n') + '\nНапиши одну следующую реплику только от имени ' + self + '. Не начинай с имени.';
}

function corsHeaders(origin){
  const ok = ALLOWED.has(origin) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://digiene-pc.website.yandexcloud.net',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function readBody(event){
  let raw = event.body || '';
  if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function reply(status, headers, payload){
  return { statusCode: status, headers, body: JSON.stringify(payload) };
}

module.exports.handler = async function(event){
  const headersIn = event.headers || {};
  const origin = headersIn.Origin || headersIn.origin || '';
  const headers = corsHeaders(origin);
  const method = String(event.httpMethod || 'POST').toUpperCase();
  if (method === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (method !== 'POST') return reply(405, headers, { error: 'Только POST' });

  const key = String(process.env.YC_AI_API_KEY || '').trim();
  const folder = String(process.env.YC_FOLDER_ID || '').trim();
  if (!key || !folder) return reply(500, headers, { error: 'Прокси без ключа' });

  let body;
  try { body = readBody(event); }
  catch (e) { return reply(400, headers, { error: 'Не JSON' }); }

  const persona = PERSONAS[body.personaId];
  if (!persona) return reply(400, headers, { error: 'Неизвестный персонаж' });
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = incoming.slice().reverse().find(m => m && (m.from === 'you' || m.role === 'user'));
  if (lastUser && isRude(lastUser.text)) return reply(200, headers, { ignore: true });
  const player = safePlayer(body.player);
  SPEAKER.you = player;
  const dialog = transcript(body.personaId, incoming);
  if (!dialog) return reply(400, headers, { error: 'Нет реплики' });

  let upstream;
  try {
    upstream = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': 'Api-Key ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelUri: 'gpt://' + folder + '/' + MODEL + '/latest',
        completionOptions: { stream: false, temperature: 0.5, maxTokens: '140' },
        messages: [
          { role: 'system', text: persona + '\n' + CULTURE + '\n' + facts(body.personaId, player) },
          { role: 'user', text: dialog }
        ]
      })
    });
  } catch (e) {
    return reply(502, headers, { error: 'Модель недоступна' });
  }
  if (!upstream.ok) return reply(502, headers, { error: 'Модель ответила ошибкой' });
  const data = await upstream.json();
  const text = (((data.result || {}).alternatives || [])[0] || {}).message;
  const out = cleanLine(text && text.text).slice(0, 400);
  if (!out) return reply(502, headers, { error: 'Пустой ответ' });
  return reply(200, headers, { text: out });
};
