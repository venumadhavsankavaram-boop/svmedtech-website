/* SVM EdTech website: remembers which kind of institution a visitor chose, and offers an optional feedback form
   (a Feedback button on every page, and one gentle prompt when a visitor on a computer is about to leave).
   No cookies, no tracking. The choice is kept only in this browser. Feedback is sent only when the visitor presses Send. */
(function () {
  'use strict';
  var TYPES = { school: 'School', junior_college: 'Junior College', degree_college: 'Degree College' };
  var PAGES = { '/schools/': 'school', '/junior-colleges/': 'junior_college', '/degree-colleges/': 'degree_college' };
  var LEADS = 'https://admin.svmedtech.com/api/public/leads';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---- 1. the visitor's choice ---- */
  var path = location.pathname.replace(/index\.html$/, '');
  var pageType = PAGES[path] || null;
  if (pageType) set('svmType', pageType);
  var chosen = get('svmType'); if (!TYPES[chosen]) chosen = null;
  var typeNow = pageType || chosen;

  /* Choosing a card (or any link to a type page) remembers it before the page changes. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href'); if (PAGES[h]) set('svmType', PAGES[h]);
    if (/(^|\/\/)(demo|college|degree)\.svmedtech\.com/.test(a.href)) {
      var m = /\/\/(demo|college|degree)\./.exec(a.href); set('svmType', { demo: 'school', college: 'junior_college', degree: 'degree_college' }[m[1]]);
    }
  });

  /* On the home page, a returning visitor sees what they chose, with one tap to open it or to choose again. */
  var choose = document.getElementById('choose');
  if (choose && chosen && path === '/') {
    var url = Object.keys(PAGES).filter(function (k) { return PAGES[k] === chosen; })[0];
    var bar = document.createElement('div');
    bar.className = 'wrap'; bar.style.cssText = 'padding-block:0 18px';
    bar.innerHTML = '<div role="status" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;background:var(--navy-soft);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:12px 16px">' +
      '<span style="flex:1;min-width:200px">Welcome back. You looked at the <b>' + esc(TYPES[chosen]) + '</b> ERP last time.</span>' +
      '<a class="btn btn-primary" href="' + url + '">Open it</a>' +
      '<button type="button" class="btn btn-ghost" id="svmForget">Choose another</button></div>';
    choose.parentNode.insertBefore(bar, choose);
    document.getElementById('svmForget').onclick = function () { try { localStorage.removeItem('svmType'); } catch (e) {} bar.remove(); };
  }
  /* The demo form starts on the visitor's type. */
  var sel = document.querySelector('#leadForm select[name="type"]');
  if (sel && typeNow) { for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === TYPES[typeNow]) sel.selectedIndex = i; }

  /* ---- 2. feedback ---- */
  var css = document.createElement('style');
  css.textContent = '.fbTab{position:fixed;left:calc(max(16px,env(safe-area-inset-left,0px)) + 68px);bottom:max(22px,env(safe-area-inset-bottom,0px));z-index:60;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:600 14px var(--body);padding:10px 16px;border-radius:999px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}' +
    '.fbTab:hover{border-color:var(--navy)}@media (max-width:520px){.fbTab{left:max(16px,env(safe-area-inset-left,0px));bottom:calc(max(16px,env(safe-area-inset-bottom,0px)) + 68px)}}' +
    '.fbBack{position:fixed;inset:0;z-index:100;background:rgba(10,12,30,.55);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.fbBox{background:var(--surface);color:var(--ink);border-radius:16px;max-width:480px;width:100%;max-height:92vh;overflow:auto;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.35);font:15px/1.5 var(--body)}' +
    '.fbBox h2{font:700 21px var(--display,var(--body));margin:0 0 4px}.fbBox p{margin:0 0 12px;color:var(--muted);font-size:14px}' +
    '.fbBox label{display:block;font-weight:600;font-size:14px;margin:12px 0 4px}' +
    '.fbBox textarea,.fbBox input[type=text],.fbBox input[type=email],.fbBox select{width:100%;box-sizing:border-box;padding:10px 12px;font:16px var(--body);border:1px solid var(--line);border-radius:8px;background:var(--bg,var(--surface));color:var(--ink)}' +
    '.fbStars{display:flex;gap:6px}.fbStars button{flex:1;border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:10px;padding:10px 0;font-size:22px;cursor:pointer}' +
    '.fbStars button[aria-pressed=true]{background:var(--navy);color:var(--navy-ink);border-color:var(--navy)}' +
    '.fbChips{display:flex;flex-wrap:wrap;gap:6px}.fbChips label{display:inline-flex;align-items:center;gap:6px;margin:0;font-weight:500;border:1px solid var(--line);border-radius:999px;padding:6px 12px;cursor:pointer}' +
    '.fbRow{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}' +
    '.fbMsg{min-height:1.3em;font-size:13px;margin-top:8px}.fbMsg.err{color:#b3261e}.fbMsg.ok{color:#1b7a3d}.fbHp{position:absolute;left:-9999px;height:0;overflow:hidden}';
  document.head.appendChild(css);

  var MATTERS = ['Fees and accounts', 'Attendance', 'Exams and results', 'Parent / student app', 'Staff and payroll', 'Price', 'Setup help', 'Something else'];
  var rating = 0, opened = false, sent = get('svmFbSent');
  function close() { var m = document.getElementById('fbModal'); if (m) m.remove(); opened = false; document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') { set('svmFbSeen', String(Date.now())); close(); } }
  function open(fromExit) {
    if (opened) return; opened = true; rating = 0;
    var who = typeNow ? TYPES[typeNow] : '';
    var m = document.createElement('div'); m.id = 'fbModal'; m.className = 'fbBack';
    m.innerHTML = '<div class="fbBox" role="dialog" aria-modal="true" aria-labelledby="fbT">' +
      '<h2 id="fbT">' + (fromExit ? 'Before you go, a quick question' : 'Tell us what you think') + '</h2>' +
      '<p>Two minutes of your thoughts helps us build the right ERP for ' + (who ? 'a ' + esc(who.toLowerCase()) : 'your institution') + '. Everything here is optional.</p>' +
      '<label>How was your visit?</label><div class="fbStars" id="fbStars">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" aria-pressed="false" aria-label="' + n + ' out of 5" data-n="' + n + '">' + ['😞', '😕', '😐', '🙂', '😀'][n - 1] + '</button>'; }).join('') + '</div>' +
      '<label>I am from a</label><select id="fbType">' + Object.keys(TYPES).map(function (k) { return '<option value="' + TYPES[k] + '"' + (k === typeNow ? ' selected' : '') + '>' + TYPES[k] + '</option>'; }).join('') + '<option value="Other"' + (typeNow ? '' : ' selected') + '>Other / not sure</option></select>' +
      '<label>What matters most to you?</label><div class="fbChips" id="fbMat">' + MATTERS.map(function (x) { return '<label><input type="checkbox" value="' + esc(x) + '"> ' + esc(x) + '</label>'; }).join('') + '</div>' +
      '<label for="fbText">What were you looking for, or what is missing?</label><textarea id="fbText" rows="4" maxlength="800" placeholder="For example: I could not find the price, or I need hostel fees for my college"></textarea>' +
      '<label for="fbName">Your name and phone or email <span style="font-weight:400;color:var(--muted)">(only if you want us to reply)</span></label>' +
      '<input type="text" id="fbName" placeholder="Name" autocomplete="name" style="margin-bottom:6px"><input type="text" id="fbCon" placeholder="Phone or email" autocomplete="off">' +
      '<div class="fbHp" aria-hidden="true"><input type="text" id="fbHp" tabindex="-1" autocomplete="off"></div>' +
      '<div class="fbMsg" id="fbMsg" role="status" aria-live="polite"></div>' +
      '<div class="fbRow"><button type="button" class="btn btn-ghost" id="fbNo">' + (fromExit ? 'No thanks' : 'Cancel') + '</button><button type="button" class="btn btn-primary" id="fbSend">Send feedback</button></div>' +
      '<p style="margin:12px 0 0;font-size:12px">We use this only to improve SVM EdTech. See our <a href="/privacy/">privacy policy</a>.</p></div>';
    document.body.appendChild(m); document.addEventListener('keydown', onKey);
    m.addEventListener('click', function (e) { if (e.target === m) { set('svmFbSeen', String(Date.now())); close(); } });
    document.getElementById('fbNo').onclick = function () { set('svmFbSeen', String(Date.now())); close(); };
    Array.prototype.forEach.call(m.querySelectorAll('#fbStars button'), function (b) {
      b.onclick = function () { rating = +b.getAttribute('data-n'); Array.prototype.forEach.call(m.querySelectorAll('#fbStars button'), function (x) { x.setAttribute('aria-pressed', String(+x.getAttribute('data-n') === rating)); }); };
    });
    document.getElementById('fbSend').onclick = send;
    var first = document.getElementById('fbText'); if (first && !fromExit) first.focus();
  }
  function send() {
    var msg = document.getElementById('fbMsg'), btn = document.getElementById('fbSend');
    var text = document.getElementById('fbText').value.trim(), name = document.getElementById('fbName').value.trim(), con = document.getElementById('fbCon').value.trim();
    var mat = Array.prototype.map.call(document.querySelectorAll('#fbMat input:checked'), function (x) { return x.value; });
    if (!rating && !text && !mat.length) { msg.className = 'fbMsg err'; msg.textContent = 'Please pick a face, a topic or write a few words first.'; return; }
    var email = /@/.test(con) ? con : '', phone = email ? '' : con;
    var body = {
      contactName: name || 'Anonymous visitor', email: email || (phone ? '' : 'site-feedback@svmedtech.com'), phone: phone,
      schoolName: '', website: document.getElementById('fbHp').value,
      message: '[Site feedback][' + document.getElementById('fbType').value + '] Rating: ' + (rating ? rating + '/5' : 'not given') + (mat.length ? ' | Matters: ' + mat.join(', ') : '') + ' | Page: ' + (location.pathname || '/') + (text ? ' | ' + text : '')
    };
    btn.disabled = true; msg.className = 'fbMsg'; msg.textContent = 'Sending...';
    fetch(LEADS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error((j && j.error) || 'Could not send'); }, function () { throw new Error('Could not send'); });
      set('svmFbSent', String(Date.now())); sent = '1';
      document.querySelector('.fbBox').innerHTML = '<h2>Thank you</h2><p>Your feedback reached us. We read every note and it shapes what we build next.</p><div class="fbRow"><button type="button" class="btn btn-primary" id="fbDone">Close</button></div>';
      document.getElementById('fbDone').onclick = close;
    }).catch(function (e) { msg.className = 'fbMsg err'; msg.textContent = (e && e.message && e.message !== 'Failed to fetch' ? e.message : 'Could not send just now.') + ' You can also email venu@svmedtech.com.'; btn.disabled = false; });
  }
  var tab = document.createElement('button'); tab.type = 'button'; tab.className = 'fbTab'; tab.textContent = 'Feedback'; tab.setAttribute('aria-haspopup', 'dialog');
  tab.onclick = function () { open(false); };
  var foot = document.querySelector('footer .wrap');
  if (window.matchMedia && window.matchMedia('(max-width:520px)').matches && foot) {
    /* On a phone the floating buttons already crowd the screen, so Feedback sits in the footer instead. */
    tab.className = 'btn btn-ghost fbFoot'; tab.style.cssText = 'margin-top:14px'; tab.textContent = 'Send us feedback'; foot.appendChild(tab);
  } else document.body.appendChild(tab);

  /* One gentle prompt as a visitor on a computer moves to leave, only after they have spent a little time here,
     never twice in a session, not again for 30 days after they answered or dismissed it, and never after they sent a demo request. */
  var start = Date.now();
  function quiet() {
    var seen = +(get('svmFbSeen') || 0), done = +(sent || 0);
    return sget('svmFbShown') || (seen && Date.now() - seen < 30 * 864e5) || (done && Date.now() - done < 90 * 864e5);
  }
  if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.addEventListener('mouseout', function (e) {
      if (e.clientY > 0 || e.relatedTarget || opened || quiet() || Date.now() - start < 20000) return;
      var lead = document.getElementById('leadNote'); if (lead && /Thank you/.test(lead.textContent)) return;
      sset('svmFbShown', '1'); open(true);
    });
  }
})();

/* Film players: poster first, plays with sound only when the visitor clicks. No tracking; the clip name is only added to a demo request if the visitor plays it and then sends the form. */
(function () {
  document.querySelectorAll('.film-player').forEach(function (box) {
    var btn = box.querySelector('.play'); if (!btn) return;
    btn.addEventListener('click', function () {
      var v = document.createElement('video');
      v.src = box.getAttribute('data-src'); v.poster = box.getAttribute('data-poster');
      v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('aria-label', box.getAttribute('data-label') || 'SVM EdTech video');
      var im = box.querySelector('img'); if (im) im.style.display = 'none'; box.replaceChild(v, btn); var p = v.play(); if (p && p.catch) p.catch(function () {});
      window.__svmFrom = box.getAttribute('data-name') || '';
    });
  });
})();
