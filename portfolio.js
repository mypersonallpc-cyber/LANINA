/* ==========================================================
   RoyalCheck — portfolio page: renders from admin data + scroll animations
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = Store.esc, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var observer, typedTimer, P;
 
  var gradients = [
    'linear-gradient(135deg,#7c5cff,#00d4ff)', 'linear-gradient(135deg,#ff4fa3,#ff8a00)',
    'linear-gradient(135deg,#11998e,#38ef7d)', 'linear-gradient(135deg,#f7971e,#ffd200)',
    'linear-gradient(135deg,#4776e6,#8e54e9)', 'linear-gradient(135deg,#ee0979,#ff6a00)'
  ];
  var socialLabels = { github: 'GH', linkedin: 'in', twitter: 'X', instagram: 'IG' };
 
  function initials(name) {
    var p = String(name).trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }
 
  /* ---------- Render everything from stored data ---------- */
  function render() {
    P = Store.get().portfolio;
    document.title = P.name + ' — Portfolio';
    $('#navName').textContent = P.name.split(' ')[0];
    $('#navMark').textContent = initials(P.name)[0];
    $('#heroName').textContent = P.name;
    $('#heroTag').textContent = P.tagline;
 
    var av = $('#avatar');
    if (P.photo) av.innerHTML = '<img alt="' + esc(P.name) + '" src="' + esc(Store.safeUrl(P.photo)) + '">';
    else av.textContent = initials(P.name);
 
    var rb = $('#resumeBtn');
    if (P.resume) { rb.hidden = false; rb.href = Store.safeUrl(P.resume); } else rb.hidden = true;
 
    $('#heroSocials').innerHTML = Object.keys(socialLabels).filter(function (k) { return P.socials[k]; }).map(function (k) {
      return '<a href="' + esc(Store.safeUrl(P.socials[k])) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + socialLabels[k] + '</a>';
    }).join('');
 
    // marquee of skills
    var words = P.skills.map(function (s) { return s.name; });
    var track = words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
    $('#marquee').innerHTML = track + track + track + track;
 
    // about
    $('#aboutText').innerHTML = String(P.about).split(/\n\s*\n/).map(function (t) { return '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'; }).join('');
    $('#infoList').innerHTML = [['Name', P.name], ['Email', P.email], ['Phone', P.phone], ['From', P.location]].filter(function (r) { return r[1]; })
      .map(function (r) { return '<div><b>' + r[0] + '</b><span>' + esc(r[1]) + '</span></div>'; }).join('');
 
    $('#stats').innerHTML = P.stats.map(function (s, i) {
      return '<div class="stat glass reveal zoom tilt" style="--d:' + (i * 0.12) + 's"><strong><span class="count" data-to="' + Number(s.value || 0) +
             '">0</span>' + esc(s.suffix || '') + '</strong><span>' + esc(s.label) + '</span></div>';
    }).join('');
 
    $('#skillsGrid').innerHTML = P.skills.map(function (s, i) {
      var lv = Math.max(0, Math.min(100, Number(s.level) || 0));
      return '<div class="skill reveal ' + (i % 2 ? 'right' : 'left') + '" style="--d:' + (i * 0.08) + 's"><div class="top"><span>' + esc(s.name) + '</span><span>' + lv +
             '%</span></div><div class="track"><div class="fill" data-w="' + lv + '"></div></div></div>';
    }).join('');
 
    $('#timeline').innerHTML = P.experience.map(function (x, i) {
      return '<div class="t-item glass reveal ' + (i % 2 ? 'right' : 'left') + '" style="--d:' + (i * 0.1) + 's"><span class="period">' + esc(x.period) + '</span><h3>' + esc(x.role) +
             '</h3><div class="place">' + esc(x.place) + '</div><p>' + esc(x.desc) + '</p></div>';
    }).join('');
 
    $('#projectGrid').innerHTML = P.projects.map(function (p, i) {
      return '<a class="project glass reveal tilt" style="--d:' + (i * 0.1) + 's" href="' + esc(Store.safeUrl(p.link)) + '" target="_blank" rel="noopener">' +
             '<div class="thumb" style="background:' + gradients[i % gradients.length] + '">' + esc((p.title || '?').charAt(0).toUpperCase()) + '</div>' +
             '<div class="body"><span class="tag">' + esc(p.tag) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p><span class="go">View project <span>→</span></span></div></a>';
    }).join('');
 
    var cards = [];
    if (P.email) cards.push(['✉', 'Email', P.email, 'mailto:' + P.email]);
    if (P.phone) cards.push(['☎', 'Phone', P.phone, 'tel:' + P.phone.replace(/[^\d+]/g, '')]);
    if (P.location) cards.push(['📍', 'Location', P.location, '']);
    if (P.website) cards.push(['🌐', 'Website', P.website, Store.safeUrl(P.website)]);
    $('#contactCards').innerHTML = cards.map(function (c, i) {
      var inner = '<span class="ic">' + c[0] + '</span><div><small>' + c[1] + '</small><b>' + esc(c[2]) + '</b></div>' +
                  '<button class="btn btn-ghost btn-sm copy" data-copy="' + esc(c[2]) + '" type="button">Copy</button>';
      return '<div class="c-card glass reveal left" style="--d:' + (i * 0.1) + 's">' + inner + '</div>';
    }).join('') + '<div class="socials reveal" style="--d:.4s;margin-top:.4rem">' + $('#heroSocials').innerHTML + '</div>';
 
    $('#footer').innerHTML = '© ' + new Date().getFullYear() + ' <b>' + esc(P.name) + '</b>. Crafted with ♥ · <a href="admin.html">Admin</a> · <a href="index.html">Main site</a>';
 
    startTyped();
    observe();
    bindTilt();
  }
 
  /* ---------- Typed role animation ---------- */
  function startTyped() {
    clearTimeout(typedTimer);
    var roles = String(P.roles || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var el = $('#typed'); if (!roles.length) { el.textContent = ''; return; }
    if (reduce) { el.textContent = roles[0]; return; }
    var r = 0, c = 0, del = false;
    (function tick() {
      var w = roles[r]; c += del ? -1 : 1; el.textContent = w.slice(0, c);
      var t = del ? 40 : 85;
      if (!del && c === w.length) { del = true; t = 1500; }
      else if (del && c === 0) { del = false; r = (r + 1) % roles.length; t = 350; }
      typedTimer = setTimeout(tick, t);
    })();
  }
 
  /* ---------- Scroll reveal, skill bars, counters ---------- */
  function observe() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; el.classList.add('in'); observer.unobserve(el);
        var fill = el.querySelector('.fill'); if (fill) setTimeout(function () { fill.style.width = fill.dataset.w + '%'; }, 250);
        var cnt = el.querySelector('.count'); if (cnt) countUp(cnt);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { observer.observe(el); });
  }
  function countUp(el) {
    var to = Number(el.dataset.to) || 0, start = performance.now(), dur = 1800;
    if (reduce) { el.textContent = to.toLocaleString(); return; }
    (function step(now) {
      var p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
 
  /* ---------- 3D tilt on hover ---------- */
  function bindTilt() {
    if (reduce) return;
    $$('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transition = 'transform .1s';
        card.style.transform = 'perspective(800px) rotateX(' + (-y * 10) + 'deg) rotateY(' + (x * 12) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transition = 'transform .5s'; card.style.transform = ''; });
    });
  }
 
  /* ---------- Scroll effects: progress bar, nav, active link, parallax ---------- */
  var nav = $('#nav'), links = $$('#navList a[href^="#"]'), secs = ['home', 'about', 'skills', 'experience', 'projects', 'contact'];
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    $('#progress').style.width = (h > 0 ? y / h * 100 : 0) + '%';
    nav.classList.toggle('scrolled', y > 30);
    $('#toTop').classList.toggle('show', y > 600);
    var cur = 'home';
    secs.forEach(function (id) { var s = document.getElementById(id); if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id; });
    links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur); });
    if (!reduce) {
      var blobs = document.querySelectorAll('.aurora i');
      blobs.forEach(function (b, i) { b.style.translate = '0 ' + (y * (0.05 + i * 0.04)) + 'px'; });
      var av = $('#avatar'); if (av && y < window.innerHeight) av.style.translate = '0 ' + (y * 0.12) + 'px';
    }
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(onScroll); }, { passive: true });
  $('#toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
 
  /* ---------- Mobile menu ---------- */
  var list = $('#navList');
  $('#burger').addEventListener('click', function () { list.classList.toggle('open'); });
  list.addEventListener('click', function (e) { if (e.target.tagName === 'A') list.classList.remove('open'); });
 
  /* ---------- Copy buttons & contact form ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(function () { Store.toast('Copied: ' + b.dataset.copy); });
  });
  $('#contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('#cfName').value.trim(), m = $('#cfEmail').value.trim(), t = $('#cfMsg').value.trim(), err = $('#cfErr');
    if (!n || !/^\S+@\S+\.\S+$/.test(m) || t.length < 5) { err.textContent = 'Please fill in your name, a valid email and a message.'; return; }
    err.textContent = '';
    var body = t + '\n\n— ' + n + ' (' + m + ')';
    window.location.href = 'mailto:' + encodeURIComponent(P.email) + '?subject=' + encodeURIComponent('Portfolio enquiry from ' + n) + '&body=' + encodeURIComponent(body);
    Store.toast('Opening your email app…');
  });
 
  /* ---------- Particle network background ---------- */
  var cv = $('#particles'), ctx = cv.getContext('2d'), dots = [], mouse = { x: -999, y: -999 };
  function sizeCanvas() {
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    var n = Math.min(70, Math.floor(cv.width * cv.height / 22000)); dots = [];
    for (var i = 0; i < n; i++) dots.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 });
  }
  window.addEventListener('resize', sizeCanvas); sizeCanvas();
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  function drawParticles() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    var light = document.documentElement.getAttribute('data-theme') === 'light', rgb = light ? '90,70,200' : '160,150,255';
    for (var i = 0; i < dots.length; i++) {
      var a = dots[i]; a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > cv.width) a.vx *= -1; if (a.y < 0 || a.y > cv.height) a.vy *= -1;
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, 6.28); ctx.fillStyle = 'rgba(' + rgb + ',.7)'; ctx.fill();
      for (var j = i + 1; j < dots.length; j++) {
        var b = dots[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < 14000) { ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.25 * (1 - d / 14000)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      var mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
      if (md < 22000) { ctx.strokeStyle = 'rgba(0,212,255,' + (0.5 * (1 - md / 22000)) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); a.x += mx * 0.002; a.y += my * 0.002; }
    }
    requestAnimationFrame(drawParticles);
  }
  if (!reduce) drawParticles();
 
  /* ---------- Go ---------- */
  render(); onScroll();
  Store.onChange(function () { render(); }); // live update when admin saves in another tab
})();
 
