/* ==========================================================
   RoyalCheck — admin panel logic
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var data;
 
  /* ---------- Login ---------- */
  function boot() {
    if (Store.isAuthed()) enter();
  }
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = $('#loginPw').value;
    if (Store.login(pw)) { $('#loginErr').textContent = ''; enter(); }
    else {
      $('#loginErr').textContent = 'Wrong password. Please try again.';
      var c = $('.login-card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      $('#loginPw').select();
    }
  });
  $('#logoutBtn').addEventListener('click', function () { Store.logout(); location.reload(); });
 
  function enter() {
    $('#loginView').hidden = true; $('#appView').hidden = false;
    data = Store.get();
    buildMobileTabs(); renderSubs(); fillMessages(); fillPortfolio();
  }
 
  /* ---------- Tabs ---------- */
  var titles = {
    subs: ['Submissions', 'Everything visitors have entered.'],
    msgs: ['Messages', 'Edit what visitors see after choosing King or Poor.'],
    port: ['Portfolio', 'Update your profile, contact details, skills and projects.'],
    sett: ['Settings', 'Password, backup and reset.']
  };
  function setTab(t) {
    $$('.tab-btn[data-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    $$('.tab-pane').forEach(function (p) { p.classList.toggle('on', p.id === 'pane-' + t); });
    $('#paneTitle').textContent = titles[t][0]; $('#paneSub').textContent = titles[t][1];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function buildMobileTabs() {
    var box = $('#mobileTabs'); box.innerHTML = '';
    [['subs', '📊 Entries'], ['msgs', '💬 Messages'], ['port', '🧑‍💻 Portfolio'], ['sett', '⚙️ Settings']].forEach(function (x) {
      var b = document.createElement('button'); b.className = 'tab-btn'; b.dataset.tab = x[0]; b.textContent = x[1]; box.appendChild(b);
    });
    $$('.tab-btn[data-tab]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); }); });
  }
 
  /* ---------- Submissions ---------- */
  function fmt(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
           d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  function renderSubs() {
    data = Store.get();
    var all = data.submissions, k = all.filter(function (s) { return s.choice === 'king'; }).length, p = all.length - k;
    $('#kTotal').textContent = all.length; $('#kKing').textContent = k; $('#kPoor').textContent = p;
    $('#barK').style.width = all.length ? (k / all.length * 100) + '%' : '0';
    $('#barP').style.width = all.length ? (p / all.length * 100) + '%' : '0';
 
    var q = $('#subSearch').value.trim().toLowerCase(), f = $('#subFilter').value;
    var rows = all.filter(function (s) { return (f === 'all' || s.choice === f) && s.name.toLowerCase().indexOf(q) !== -1; });
    var body = $('#subBody'); body.innerHTML = '';
    rows.forEach(function (s, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (i + 1) + '</td><td><b>' + Store.esc(s.name) + '</b></td>' +
        '<td><span class="pill ' + s.choice + '">' + (s.choice === 'king' ? '👑 King' : '🌱 Poor') + '</span></td>' +
        '<td>' + Store.esc(fmt(s.time)) + '</td>' +
        '<td style="text-align:right"><button class="btn btn-danger btn-sm" data-del="' + Store.esc(s.id) + '">Delete</button></td>';
      body.appendChild(tr);
    });
    $('#subEmpty').hidden = rows.length > 0;
    $('.table-wrap table').style.display = rows.length ? '' : 'none';
  }
  $('#subSearch').addEventListener('input', renderSubs);
  $('#subFilter').addEventListener('change', renderSubs);
  $('#subBody').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-del'); if (!id) return;
    var d = Store.get(); d.submissions = d.submissions.filter(function (s) { return s.id !== id; });
    Store.save(d); renderSubs(); Store.toast('Entry deleted');
  });
  $('#clearSubs').addEventListener('click', function () {
    if (!Store.get().submissions.length) return Store.toast('Nothing to clear', 'bad');
    if (!confirm('Delete ALL submissions? This cannot be undone.')) return;
    var d = Store.get(); d.submissions = []; Store.save(d); renderSubs(); Store.toast('All submissions cleared');
  });
  $('#exportCsv').addEventListener('click', function () {
    var list = Store.get().submissions;
    if (!list.length) return Store.toast('No data to export', 'bad');
    var csv = 'Name,Choice,Date\n' + list.map(function (s) {
      var n = String(s.name).replace(/"/g, '""'); if (/^[=+\-@]/.test(n)) n = "'" + n;
      return '"' + n + '",' + s.choice + ',' + s.time;
    }).join('\n');
    download('royalcheck-submissions.csv', csv, 'text/csv');
  });
 
  /* ---------- Messages ---------- */
  function fillMessages() {
    ['king', 'poor'].forEach(function (k) {
      var m = data.messages[k];
      $('#' + k + '-emoji').value = m.emoji; $('#' + k + '-title').value = m.title; $('#' + k + '-text').value = m.text;
      ['emoji', 'title', 'text'].forEach(function (f) { $('#' + k + '-' + f).addEventListener('input', previewMsgs); });
    });
    $('#pvName').addEventListener('input', previewMsgs);
    previewMsgs();
  }
  function previewMsgs() {
    var n = $('#pvName').value.trim() || 'Ayush';
    ['king', 'poor'].forEach(function (k) {
      $('#pv-' + k + '-e').textContent = $('#' + k + '-emoji').value;
      $('#pv-' + k + '-t').textContent = Store.format($('#' + k + '-title').value, n);
      $('#pv-' + k + '-m').textContent = Store.format($('#' + k + '-text').value, n);
    });
  }
  $('#saveMsgs').addEventListener('click', function () {
    var d = Store.get(), ok = true;
    ['king', 'poor'].forEach(function (k) {
      var t = $('#' + k + '-title').value.trim(), x = $('#' + k + '-text').value.trim();
      if (!t || !x) { ok = false; return; }
      d.messages[k] = { emoji: $('#' + k + '-emoji').value.trim() || (k === 'king' ? '👑' : '🌱'), title: t, text: x };
    });
    if (!ok) return Store.toast('Title and message cannot be empty', 'bad');
    Store.save(d); data = d; Store.toast('Messages saved — live on the website!');
  });
  $('#resetMsgs').addEventListener('click', function () {
    if (!confirm('Restore the default messages?')) return;
    var d = Store.get(); d.messages = Store.defaults().messages; Store.save(d); data = d;
    ['king', 'poor'].forEach(function (k) {
      $('#' + k + '-emoji').value = d.messages[k].emoji; $('#' + k + '-title').value = d.messages[k].title; $('#' + k + '-text').value = d.messages[k].text;
    });
    previewMsgs(); Store.toast('Defaults restored');
  });
 
  /* ---------- Portfolio editor ---------- */
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a && a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(); var t = ks.reduce(function (a, k) { return a[k]; }, o); t[last] = v; }
 
  function fillPortfolio() {
    $$('[data-path]').forEach(function (inp) {
      inp.value = getPath(data, inp.dataset.path) || '';
      inp.addEventListener('input', function () { setPath(data, inp.dataset.path, inp.value); });
    });
    var P = data.portfolio;
    list('stats', P.stats, [['label', 'Label'], ['value', 'Value', 'number'], ['suffix', 'Suffix']], { label: 'New stat', value: 10, suffix: '+' });
    list('skills', P.skills, [['name', 'Skill', 'text', true], ['level', 'Level (0-100)', 'number']], { name: 'New skill', level: 80 });
    list('experience', P.experience, [['role', 'Role'], ['place', 'Company / place'], ['period', 'Period'], ['desc', 'Description', 'textarea', true]], { role: 'New role', place: 'Company', period: '2025', desc: 'What you did…' });
    list('projects', P.projects, [['title', 'Title'], ['tag', 'Category'], ['link', 'Link'], ['desc', 'Description', 'textarea', true]], { title: 'New project', tag: 'Web', link: '#', desc: 'Describe your project…' });
  }
 
  function list(key, arr, fields, blank) {
    var host = $('#ed-' + key); host.innerHTML = '';
    arr.forEach(function (item, i) {
      var row = document.createElement('div'); row.className = 'row-card';
      fields.forEach(function (f) {
        var lab = document.createElement('label'); lab.className = 'field' + (f[3] ? ' wide' : '');
        var sp = document.createElement('span'); sp.textContent = f[1].toUpperCase();
        var inp = document.createElement(f[2] === 'textarea' ? 'textarea' : 'input');
        if (f[2] === 'number') inp.type = 'number'; if (f[2] === 'textarea') inp.rows = 3;
        inp.value = item[f[0]] == null ? '' : item[f[0]];
        inp.addEventListener('input', function () { item[f[0]] = f[2] === 'number' ? Number(inp.value) : inp.value; });
        lab.appendChild(sp); lab.appendChild(inp); row.appendChild(lab);
      });
      var rm = document.createElement('button'); rm.className = 'btn btn-danger btn-sm rm'; rm.textContent = '✕ Remove';
      rm.addEventListener('click', function () { arr.splice(i, 1); list(key, arr, fields, blank); });
      row.appendChild(rm); host.appendChild(row);
    });
    if (!arr.length) host.innerHTML = '<div class="empty">Nothing here yet — add your first item.</div>';
    $('#add-' + key).onclick = function () { arr.push(JSON.parse(JSON.stringify(blank))); list(key, arr, fields, blank); };
  }
 
  $('#savePort').addEventListener('click', function () {
    var d = Store.get(); d.portfolio = data.portfolio;
    if (!String(d.portfolio.name).trim()) return Store.toast('Name cannot be empty', 'bad');
    Store.save(d); Store.toast('Portfolio saved — refresh the portfolio page!');
  });
 
  /* ---------- Settings ---------- */
  $('#pwForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var o = $('#pwOld').value, n = $('#pwNew').value, n2 = $('#pwNew2').value;
    if (!Store.checkPassword(o)) return Store.toast('Current password is wrong', 'bad');
    if (n.length < 6) return Store.toast('New password must be 6+ characters', 'bad');
    if (n !== n2) return Store.toast('Passwords do not match', 'bad');
    var d = Store.get(); d.adminHash = Store.hash(n); Store.save(d);
    $('#pwForm').reset(); Store.toast('Password updated');
  });
  $('#exportJson').addEventListener('click', function () {
    var d = Store.get(); download('royalcheck-backup.json', JSON.stringify(d, null, 2), 'application/json');
  });
  $('#importJson').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var obj = JSON.parse(r.result);
        if (!obj || typeof obj !== 'object' || !obj.messages || !obj.portfolio) throw new Error('bad');
        Store.save(obj); data = Store.get(); renderSubs(); fillMessages(); fillPortfolio(); Store.toast('Backup imported');
      } catch (err) { Store.toast('That file is not a valid backup', 'bad'); }
    };
    r.readAsText(f); e.target.value = '';
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm('Reset ALL data (messages, entries, portfolio, password)? This cannot be undone.')) return;
    Store.reset(); Store.logout(); location.reload();
  });
 
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
 
  boot();
})();
 
