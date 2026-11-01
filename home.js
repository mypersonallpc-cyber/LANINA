/* ==========================================================
   RoyalCheck — home page logic (name → choice → message)
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var panels = { name: $('#stepName'), choice: $('#stepChoice'), result: $('#stepResult') };
  var dots = document.querySelectorAll('.steps span');
  var order = ['name', 'choice', 'result'];
  var person = '', lastText = '', typeTimer = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  function show(key) {
    order.forEach(function (k, i) {
      panels[k].classList.toggle('active', k === key);
      dots[i].classList.toggle('on', i <= order.indexOf(key));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
 
  /* ---------- Step 1: name ---------- */
  $('#nameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#nameInput'), err = $('#nameErr');
    var raw = input.value.trim().replace(/\s+/g, ' ');
    if (raw.length < 2) {
      err.textContent = 'Please enter your name (at least 2 characters).';
      input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
      input.focus();
      return;
    }
    err.textContent = '';
    person = Store.pretty(raw);
    $('#kingLabel').textContent = person + ' is a King';
    $('#poorLabel').textContent = person + ' is Poor';
    show('choice');
  });
  $('#backBtn').addEventListener('click', function () { show('name'); $('#nameInput').focus(); });
 
  /* ---------- Step 2: choice ---------- */
  $('#btnKing').addEventListener('click', function () { choose('king'); });
  $('#btnPoor').addEventListener('click', function () { choose('poor'); });
 
  function choose(kind) {
    Store.addSubmission(person, kind);
    var m = Store.get().messages[kind];
    var res = panels.result;
    res.setAttribute('data-kind', kind);
    $('#resEmoji').textContent = m.emoji || (kind === 'king' ? '👑' : '🌱');
    $('#resBadge').textContent = kind === 'king' ? person + ' · King' : person + ' · Poor';
    $('#resTitle').textContent = Store.format(m.title, person);
    lastText = Store.format(m.text, person);
    show('result');
    typeWriter($('#resMsg'), lastText);
    if (kind === 'king') burst(['#ffc83d', '#ff9f1c', '#fff2b0', '#ffffff', '#7c5cff'], 160, 0.22, 16);
    else burst(['#2dd4bf', '#38bdf8', '#a7f3d0', '#ffffff'], 90, 0.08, 9);
  }
 
  function typeWriter(el, text) {
    clearInterval(typeTimer);
    if (reduce) { el.textContent = text; el.classList.remove('typing'); return; }
    el.textContent = ''; el.classList.add('typing');
    var i = 0;
    typeTimer = setInterval(function () {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(typeTimer); el.classList.remove('typing'); }
    }, 22);
  }
 
  /* ---------- Step 3 actions ---------- */
  $('#againBtn').addEventListener('click', function () {
    clearInterval(typeTimer);
    $('#nameInput').value = '';
    show('name');
    setTimeout(function () { $('#nameInput').focus(); }, 300);
  });
  $('#copyBtn').addEventListener('click', function () {
    var txt = $('#resTitle').textContent + '\n\n' + lastText;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { Store.toast('Message copied!'); }, function () { Store.toast('Copy failed', 'bad'); });
    else Store.toast('Copy not supported here', 'bad');
  });
 
  /* ---------- Confetti / sparkle engine ---------- */
  var cv = $('#fx'), ctx = cv.getContext('2d'), parts = [], raf = null;
  function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
 
  function burst(colors, count, gravity, spread) {
    if (reduce) return;
    for (var i = 0; i < count; i++) {
      parts.push({
        x: window.innerWidth / 2, y: window.innerHeight * 0.38,
        vx: (Math.random() - 0.5) * spread * 1.4, vy: -Math.random() * spread - 3,
        s: 4 + Math.random() * 7, c: colors[i % colors.length], r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.35, life: 1, g: gravity, round: Math.random() > 0.6
      });
    }
    if (!raf) loop();
  }
  function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < cv.height + 30; });
    parts.forEach(function (p) {
      p.vy += p.g; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.0035;
      ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.28); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    raf = parts.length ? requestAnimationFrame(loop) : (ctx.clearRect(0, 0, cv.width, cv.height), null);
  }
 
  // Keep result page live if admin edits messages in another tab (optional nicety)
  Store.onChange(function () { /* next submission will read fresh messages automatically */ });
})();
 
