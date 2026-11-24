'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const assets = {
  '/__local/gemini/': ['index.html', 'text/html'],
  '/__local/gemini/app.js': ['app.js', 'application/javascript'],
  '/__local/gemini/style.css': ['style.css', 'text/css']
};
const instruction = [
  'You are the local test version of Muboso, a Busan food guide. Reply in the requested interface language.',
  'Use the conversation to keep the user’s location, per-person budget, solo dining preference and dietary restrictions.',
  'Ask one short follow-up only when it advances the request. Keep answers concise and practical.',
  'You do not have access to the Muboso catalog, current prices, opening hours or verified solo dining records.',
  'You may suggest general dish types. Do not identify establishments as verified or invent prices, availability, hours or ingredients.',
  'Keep allergies as hard constraints. Ask for clarification if an allergen is unclear. Never certify a dish as safe.',
  'If allergies apply, remind the user to confirm ingredients and cross-contact directly with the restaurant.'
].join(' ');

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readRequest(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return null; }
}

module.exports = async function geminiPreview(req, res, pathname, port) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const host = req.headers.host;
  const hosts = new Set(['127.0.0.1:' + port, 'localhost:' + port]);
  if (!hosts.has(host)) return json(res, 403, { error: 'localOnly' });
  if (Object.hasOwn(assets, pathname) && req.method === 'GET') {
    const [file, mimeType] = assets[pathname];
    res.writeHead(200, { 'Content-Type': mimeType + '; charset=utf-8' });
    return res.end(readFileSync(join(__dirname, 'gemini-preview', file)));
  }

  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite';
  if (pathname === '/__local/gemini/status' && req.method === 'GET') {
    return json(res, 200, { configured: Boolean(key), model });
  }
  if (pathname !== '/__local/gemini/chat') return json(res, 404, { error: 'notFound' });
  if (req.method !== 'POST') return json(res, 405, { error: 'method' });
  if (req.headers.origin !== 'http://' + host || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
    return json(res, 403, { error: 'localOnly' });
  }
  const body = await readRequest(req);
  const messages = body?.messages;
  const languages = { ko: 'Korean', en: 'English', zh: 'Simplified Chinese', ja: 'Japanese' };
  if (!Array.isArray(messages) || !messages.length || messages.length > 13 || messages.length % 2 === 0 ||
      !messages.every((message, i) => message?.role === (i % 2 === 0 ? 'user' : 'model') &&
        typeof message.text === 'string' && message.text.trim() && message.text.length <= 4000) ||
      messages.at(-1).text.length > 2000 || !Object.hasOwn(languages, body.language)) {
    return json(res, 400, { error: 'invalidMessage' });
  }
  if (!key || !/^[a-z0-9][a-z0-9.-]*$/i.test(model)) return json(res, 503, { error: 'missingConfig' });
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction + ' Interface language: ' + languages[body.language] + '.' }] },
        contents: messages.map(({ role, text }) => ({ role, parts: [{ text }] })),
        generationConfig: { maxOutputTokens: 1024 }
      })
    });
    if (!response.ok) {
      const error = { 400: 'requestRejected', 401: 'keyRejected', 403: 'keyRejected', 404: 'modelUnavailable', 429: 'rateLimited' }[response.status] || 'providerUnavailable';
      return json(res, response.status === 429 ? 429 : 502, { error });
    }
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string')
      .map(part => part.text).join('').trim();
    if (!text) return json(res, 502, { error: 'emptyResponse' });
    return json(res, 200, { text: text.slice(0, 4000) });
  } catch {
    return json(res, 502, { error: 'providerUnavailable' });
  }
};
