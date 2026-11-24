'use strict';

const params = new URLSearchParams(location.search);
let language = ['ko', 'en', 'zh', 'ja'].includes(params.get('lang')) ? params.get('lang') : 'ko';
const form = document.getElementById('composer');
const input = document.getElementById('message');
const send = document.getElementById('send');
const reset = document.getElementById('reset');
const status = document.getElementById('status');
const log = document.getElementById('messages');
const messages = [];
const errors = {
  missingConfig: '로컬 서버의 .env.local에 GEMINI_API_KEY를 설정하고 서버를 다시 시작해 주세요.',
  keyRejected: 'Gemini가 API 키를 거부했습니다. Google AI Studio에서 키와 프로젝트 설정을 확인해 주세요.',
  modelUnavailable: '이 API 키로 지정된 Gemini 모델을 사용할 수 없습니다.',
  rateLimited: 'Gemini 사용 한도 또는 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
  requestRejected: 'Gemini가 요청을 거부했습니다. 입력과 모델 설정을 확인해 주세요.',
  emptyResponse: 'Gemini에서 답변을 받지 못했습니다. 다른 표현으로 다시 시도해 주세요.',
  invalidMessage: '메시지 형식을 확인해 주세요.'
};
let configured = false;

window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin ||
      event.data?.type !== 'ieb-chatbot:mode') return;
  if (['ko', 'en', 'zh', 'ja'].includes(event.data.language)) language = event.data.language;
});

function append(role, text) {
  const bubble = document.createElement('p');
  bubble.className = 'message ' + role;
  bubble.textContent = text;
  log.append(bubble);
  log.scrollTop = log.scrollHeight;
}

async function checkConnection() {
  try {
    const response = await fetch('/__local/gemini/status');
    if (!response.ok) throw new Error();
    const result = await response.json();
    configured = result.configured;
    status.textContent = configured ? result.model + ' · 설정됨' : errors.missingConfig;
    send.disabled = !configured;
  } catch {
    status.textContent = '로컬 Gemini 서버에 연결할 수 없습니다.';
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !configured || send.disabled) return;
  send.disabled = true;
  input.readOnly = true;
  reset.disabled = true;
  status.textContent = 'Gemini가 답변을 작성하고 있어요…';
  try {
    const turn = { role: 'user', text };
    const response = await fetch('/__local/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, messages: [...messages.slice(-12), turn] }),
      signal: AbortSignal.timeout(30000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(errors[result.error] || 'Gemini에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    const reply = { role: 'model', text: result.text };
    messages.push(turn, reply);
    if (messages.length > 12) messages.splice(0, messages.length - 12);
    append(turn.role, turn.text);
    append(reply.role, reply.text);
    input.value = '';
    status.textContent = '';
  } catch (error) {
    status.textContent = error.name === 'TimeoutError'
      ? '응답 시간이 초과됐습니다. 다시 보내 주세요.'
      : error.message;
  } finally {
    send.disabled = false;
    input.readOnly = false;
    reset.disabled = false;
    input.focus();
  }
});
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form.requestSubmit();
  }
});
reset.addEventListener('click', () => {
  messages.length = 0;
  log.replaceChildren();
  input.value = '';
  if (configured) status.textContent = '';
  input.focus();
});
checkConnection();
