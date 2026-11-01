/* ==========================================================
   RoyalCheck — shared data store (no server, uses localStorage)
   Used by index.html, admin.html and portfolio.html
   ========================================================== */
(function (w) {
  'use strict';
 
  var KEY = 'royalcheck_data_v1';
  var SESSION = 'royalcheck_admin_session';
  var THEME = 'royalcheck_theme';
  var memory = null; // fallback if localStorage is blocked
 
  /* ---- tiny password hash (client-side only, NOT real security) ---- */
  function hash(str) {
    var h = 5381, s = 'rc::' + str + '::salt';
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'h' + (h >>> 0).toString(16) + s.length;
  }
 
  var DEFAULTS = {
    adminHash: hash('admin123'),
    messages: {
      king: {
        emoji: '👑',
        title: 'Long live {name}!',
        text: '{name}, you carry the crown with grace.\nWealth is more than gold — it is the courage to lead, the kindness to give and the vision to build.\nThe throne was always yours.'
      },
      poor: {
        emoji: '🌱',
        title: '{name}, your story is just beginning',
        text: '{name}, being poor in coins is never being poor in spirit.\nEvery great journey starts with an empty pocket and a full heart.\nKeep going — your richest chapter is ahead.'
      }
    },
    submissions: [],
    portfolio: {
      name: 'Alex Morgan',
      roles: 'Web Developer, UI/UX Designer, Creative Thinker',
      tagline: 'I craft fast, beautiful and meaningful digital experiences that people love to use.',
      photo: '',
      resume: '',
      about: 'I am a passionate developer and designer with a love for clean code and pixel-perfect interfaces. I turn ideas into polished products, from the first sketch to the final deploy.\n\nWhen I am not building, I explore new technologies, write about design, and mentor people who are starting their journey in tech.',
      email: 'hello@example.com',
      phone: '+91 98765 43210',
      location: 'Varanasi, India',
      website: 'https://example.com',
      socials: { github: 'https://github.com/', linkedin: 'https://linkedin.com/', twitter: 'https://twitter.com/', instagram: 'https://instagram.com/' },
      stats: [
        { label: 'Projects Done', value: 48, suffix: '+' },
        { label: 'Happy Clients', value: 32, suffix: '+' },
        { label: 'Years Experience', value: 5, suffix: '' },
        { label: 'Cups of Coffee', value: 999, suffix: '+' }
      ],
      skills: [
        { name: 'HTML & CSS', level: 95 },
        { name: 'JavaScript', level: 90 },
        { name: 'UI / UX Design', level: 85 },
        { name: 'React & Node.js', level: 80 },
        { name: 'Animations', level: 88 },
        { name: 'Problem Solving', level: 92 }
      ],
      experience: [
        { role: 'Senior Frontend Developer', place: 'Creative Studio', period: '2023 — Present', desc: 'Leading the frontend team, building design systems and shipping award-worthy interfaces.' },
        { role: 'Web Developer', place: 'Tech Solutions Pvt. Ltd.', period: '2021 — 2023', desc: 'Built responsive web apps and dashboards used by thousands of people every day.' },
        { role: 'Freelance Designer', place: 'Self-employed', period: '2019 — 2021', desc: 'Designed brands, landing pages and mobile layouts for startups across the globe.' }
      ],
      projects: [
        { title: 'Nova Dashboard', tag: 'Web App', desc: 'A real-time analytics dashboard with beautiful charts, dark mode and instant filters.', link: '#' },
        { title: 'Bloom Store', tag: 'E-commerce', desc: 'A lightning-fast online store with smooth cart animations and one-tap checkout.', link: '#' },
        { title: 'Pulse Fitness', tag: 'Mobile UI', desc: 'A motivating fitness tracker concept with gamified goals and delightful micro-interactions.', link: '#' },
        { title: 'Atlas Travel', tag: 'Landing Page', desc: 'An immersive travel landing page with parallax scenes and scroll-driven storytelling.', link: '#' }
      ]
    }
  };
 
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function merge(base, extra) {
    if (!isObj(extra)) return base;
    Object.keys(extra).forEach(function (k) {
      if (isObj(base[k]) && isObj(extra[k])) merge(base[k], extra[k]);
      else base[k] = extra[k];
    });
    return base;
  }
 
  function read() {
    try {
      var raw = w.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return memory ? clone(memory) : null; }
  }
 
  var Store = {
    defaults: function () { return clone(DEFAULTS); },
 
    get: function () {
      var saved = read();
      return merge(clone(DEFAULTS), saved || {});
    },
 
    save: function (data) {
      try { w.localStorage.setItem(KEY, JSON.stringify(data)); memory = null; return true; }
      catch (e) { memory = clone(data); return false; }
    },
 
    reset: function () {
      try { w.localStorage.removeItem(KEY); } catch (e) {}
      memory = null;
    },
 
    addSubmission: function (name, choice) {
      var d = this.get();
      d.submissions.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name, choice: choice, time: new Date().toISOString()
      });
      if (d.submissions.length > 2000) d.submissions.length = 2000;
      return this.save(d);
    },
 
    format: function (tpl, name) { return String(tpl || '').replace(/\{name\}/gi, name); },
 
    pretty: function (name) {
      return name.trim().replace(/\s+/g, ' ').split(' ').map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
    },
 
    /* ---- admin session ---- */
    login: function (pw) {
      if (hash(pw) === this.get().adminHash) {
        try { w.sessionStorage.setItem(SESSION, '1'); } catch (e) {}
        return true;
      }
      return false;
    },
    isAuthed: function () { try { return w.sessionStorage.getItem(SESSION) === '1'; } catch (e) { return false; } },
    logout: function () { try { w.sessionStorage.removeItem(SESSION); } catch (e) {} },
    checkPassword: function (pw) { return hash(pw) === this.get().adminHash; },
    hash: hash,
 
    /* ---- helpers ---- */
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    safeUrl: function (u) {
      u = String(u || '').trim();
      return /^(https?:\/\/|mailto:|tel:|#|\/|\.\/)/i.test(u) ? u : (u ? 'https://' + u.replace(/^\/+/, '') : '#');
    },
    toast: function (msg, type) {
      var host = document.getElementById('toasts');
      if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
      var t = document.createElement('div');
      t.className = 'toast ' + (type || 'ok');
      t.textContent = (type === 'bad' ? '⚠️ ' : '✅ ') + msg;
      host.appendChild(t);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 350); }, 3000);
    },
    ripple: function () {
      document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.btn');
        if (!b) return;
        var r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height);
        s.className = 'ripple';
        s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
        b.appendChild(s); setTimeout(function () { s.remove(); }, 600);
      });
    },
    initTheme: function () {
      var saved = null;
      try { saved = w.localStorage.getItem(THEME); } catch (e) {}
      var theme = saved || (w.matchMedia && w.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', theme);
      var btn = document.getElementById('themeBtn');
      function paint() { if (btn) btn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️'; }
      paint();
      if (btn) btn.addEventListener('click', function () {
        var n = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', n);
        try { w.localStorage.setItem(THEME, n); } catch (e) {}
        paint();
      });
    },
    onChange: function (fn) { w.addEventListener('storage', function (e) { if (e.key === KEY) fn(); }); }
  };
 
  w.Store = Store;
  document.addEventListener('DOMContentLoaded', function () { Store.initTheme(); Store.ripple(); });
})(window);
 
