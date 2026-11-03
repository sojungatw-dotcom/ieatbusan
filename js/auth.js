/* 로컬 시안 전용. 운영 서비스에서는 서버 인증으로 교체해야 합니다. */
(function () {
  'use strict';
  const iterations = 600000;
  const normalize = value => String(value).trim().toLowerCase();
  const fail = key => { throw new Error(key); };
  const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  function validate(username, password) {
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(String(username).trim())) fail('auth.invalidId');
    if (typeof password !== 'string' || password.length < 8 || password.length > 72 || !password.trim()) fail('auth.invalidPassword');
  }
  async function derive(password, salt) {
    if (!globalThis.crypto?.subtle) fail('auth.crypto');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
    return hex(new Uint8Array(bits));
  }
  window.Auth = {
    async register(username, password) {
      validate(username, password);
      const id = normalize(username);
      if (Store.get().accounts.some(account => account.id === id)) fail('auth.duplicate');
      if (!globalThis.crypto?.subtle) fail('auth.crypto');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hash = await derive(password, salt);
      // 비동기 계산 중 다른 탭에서 가입했을 경우에도 중복 아이디를 확인합니다.
      const persisted = JSON.parse(localStorage.getItem('ieatbusan.v1') || '{}');
      const accounts = persisted.accounts || Store.get().accounts;
      if (accounts.some(account => account.id === id)) fail('auth.duplicate');
      const account = { id, displayId: username.trim(), salt: hex(salt), hash, iterations,
        joined: new Date().toISOString().slice(0, 10).replace(/-/g, '.'), data: null };
      if (!Store.commit({ accounts: [...accounts, account] })) fail('auth.storage');
      return id;
    },
    async verify(username, password) {
      const id = normalize(username);
      const account = Store.get().accounts.find(item => item.id === id);
      if (!account || typeof account.salt !== 'string' || !/^[a-f0-9]{32}$/.test(account.salt)) fail('auth.invalidCredentials');
      const salt = Uint8Array.from(account.salt.match(/../g), pair => parseInt(pair, 16));
      const hash = await derive(password, salt);
      if (hash !== account.hash) fail('auth.invalidCredentials');
      return id;
    },
  };
})();
