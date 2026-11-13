/* App: điều hướng, nhật ký (lưu trong trình duyệt), trang Hôm nay, ngân hàng bài tập, đồng hồ */
const App = (() => {
  const KEY = 'smt-practice.v1';
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const ROUTES = { home: 't-home', log: 't-log', bank: 't-bank', cad: 't-cad', aoi: 't-aoi', judge: 't-jud', plan: 't-plan' };
  let state = { entries: [] }, canSave = true, bankFilter = 'all', logFilter = 'all';

  /* ---------- lưu trữ ---------- */
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); if (!Array.isArray(state.entries)) state.entries = []; }
    catch (e) { canSave = false; }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); canSave = true; }
    catch (e) { canSave = false; }
    $('#storeWarn').hidden = canSave;
  }
  const pad2 = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const today = () => ymd(new Date());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const vnDate = s => { const d = parse(s); return `${DOW[d.getDay()]} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const topicPill = t => t && TOPICS[t] ? `<span class="tpill" style="--c:${TOPICS[t].color}">${TOPICS[t].name}</span>` : '';

  /* ---------- điều hướng ---------- */
  function go(route) {
    const id = ROUTES[route] || 't-home';
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.route === route));
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.id === id));
    if (id === 't-aoi' && typeof drawHist === 'function') drawHist();
    if (id === 't-home') renderHome();
    if (id === 't-log') renderLog();
    if (id === 't-bank') renderBank();
  }
  function route() { const h = location.hash.replace('#', ''); go(ROUTES[h] ? h : 'home'); }

  /* ---------- đồng hồ ---------- */
  let tStart = null, tAcc = 0, tInt = null;
  const elapsed = () => tAcc + (tStart ? Date.now() - tStart : 0);
  function tick() { const s = Math.floor(elapsed() / 1000); $('#timer').textContent = `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`; }
  function timerToggle() {
    if (tStart) { tAcc += Date.now() - tStart; tStart = null; clearInterval(tInt); $('#tBtn').textContent = 'Tiếp tục'; }
    else { tStart = Date.now(); tInt = setInterval(tick, 500); $('#tBtn').textContent = 'Tạm dừng'; }
    tick();
  }
  function timerReset() { tStart = null; tAcc = 0; clearInterval(tInt); $('#tBtn').textContent = 'Bắt đầu'; tick(); }
  const timerMinutes = () => Math.round(elapsed() / 60000);

  /* ---------- hộp thoại ghi buổi học ---------- */
  function fillCodes(topic, selected) {
    const items = BANK.filter(b => !topic || b.topic === topic);
    $('#fCode').innerHTML = '<option value="">— không chọn —</option>' + items.map(b => `<option value="${b.code}" ${b.code === selected ? 'selected' : ''}>${b.code} · ${esc(b.task.slice(0, 60))}${b.task.length > 60 ? '…' : ''}</option>`).join('');
  }
  function openEntry(pre = {}) {
    const topic = pre.topic || SCHEDULE[new Date().getDay()].topic || 'cad';
    $('#fDate').value = pre.date || today();
    $('#fTopic').value = topic;
    fillCodes(topic, pre.code);
    const m = pre.minutes ?? timerMinutes();
    $('#fMin').value = m || '';
    $('#fResult').value = pre.result || '';
    $('#fScore').value = pre.score || '';
    $('#fNote').value = pre.note || '';
    $('#entryDlg').showModal();
  }
  function submitEntry(e) {
    e.preventDefault();
    const en = { id: uid(), date: $('#fDate').value || today(), topic: $('#fTopic').value, code: $('#fCode').value, minutes: Number($('#fMin').value) || 0, result: $('#fResult').value.trim(), score: $('#fScore').value, note: $('#fNote').value.trim() };
    state.entries.push(en); persist();
    $('#entryDlg').close(); timerReset();
    toast('Đã lưu vào nhật ký');
    renderHome(); renderLog(); renderBank();
  }
  function saveTool(kind) {
    const r = (window.LAST_RESULT || {})[kind]; if (!r) return;
    openEntry({ topic: kind === 'cad' ? 'cad' : 'aoi', code: r.code, result: r.result, note: r.note, score: r.pass ? '4' : '' });
  }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }

  /* ---------- thống kê ---------- */
  function streak() {
    const days = new Set(state.entries.map(e => e.date)); let d = new Date(), n = 0;
    if (!days.has(ymd(d))) d.setDate(d.getDate() - 1);
    while (days.has(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function weekCount() {
    const d = new Date(), dow = (d.getDay() + 6) % 7; const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
    return new Set(state.entries.filter(e => parse(e.date) >= mon).map(e => e.date)).size;
  }
  function suggest(topic) {
    const items = BANK.filter(b => b.topic === topic); if (!items.length) return null;
    const done = {}; state.entries.forEach(e => { if (e.code) done[e.code] = e.date > (done[e.code] || '') ? e.date : done[e.code]; });
    return items.find(b => !done[b.code]) || items.slice().sort((a, b) => (done[a.code] || '').localeCompare(done[b.code] || ''))[0];
  }

  /* ---------- Hôm nay ---------- */
  function renderHome() {
    const d = new Date(), sc = SCHEDULE[d.getDay()], sug = sc.topic ? suggest(sc.topic) : null;
    const todayEntries = state.entries.filter(e => e.date === today());
    $('#homeDate').textContent = vnDate(today());
    $('#homePlan').innerHTML = sc.topic
      ? `<div class="today-topic">${topicPill(sc.topic)}<span class="note">${sc.time}</span></div>
         <p style="margin:8px 0">${esc(sc.what)}</p>
         ${sug ? `<div class="sug"><div class="note">Bài gợi ý</div><b>${sug.code}</b> · <span class="note">${sug.level}</span><div>${esc(sug.task)}</div><div class="note">Công cụ: ${esc(sug.tools)} · Đạt khi: ${esc(sug.pass)}</div></div>` : ''}
         <div class="row">${TOPICS[sc.topic].tool ? `<button class="pri" onclick="location.hash='${sc.topic === 'cad' ? 'cad' : 'aoi'}'">Mở công cụ</button>` : ''}${sc.topic === 'aoi' ? `<button onclick="location.hash='judge'">Phán định ảnh</button>` : ''}<button class="ghost" onclick="App.openEntry({topic:'${sc.topic}',code:'${sug ? sug.code : ''}'})">Ghi buổi học</button></div>`
      : `<p>Chủ nhật: nghỉ, hoặc bù buổi bị lỡ trong tuần.</p><div class="row"><button class="ghost" onclick="App.openEntry()">Ghi buổi học</button></div>`;
    $('#homeDone').innerHTML = todayEntries.length ? `<span class="okmark">✓ Hôm nay đã ghi ${todayEntries.length} buổi (${todayEntries.reduce((s, e) => s + e.minutes, 0)} phút)</span>` : '<span class="note">Hôm nay chưa ghi buổi nào.</span>';
    const total = state.entries.reduce((s, e) => s + (e.minutes || 0), 0);
    const scored = state.entries.filter(e => e.score); const avg = scored.length ? (scored.reduce((s, e) => s + Number(e.score), 0) / scored.length).toFixed(1) : '–';
    $('#homeKpi').innerHTML = `<div class="kpi"><b>${streak()}</b><span>Chuỗi ngày liên tiếp</span></div><div class="kpi"><b>${weekCount()}/6</b><span>Ngày đã luyện tuần này</span></div><div class="kpi"><b>${state.entries.length}</b><span>Tổng số buổi</span></div><div class="kpi"><b>${Math.floor(total / 60)}h${pad2(total % 60)}</b><span>Tổng thời gian</span></div><div class="kpi"><b>${avg}</b><span>Tự chấm trung bình</span></div>`;
    const days = []; for (let i = 27; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); days.push(ymd(x)); }
    const byDay = {}; state.entries.forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + (e.minutes || 0) + 1; });
    $('#homeHeat').innerHTML = days.map(s => { const v = byDay[s] || 0, lv = v === 0 ? 0 : v < 20 ? 1 : v < 40 ? 2 : 3; return `<div class="hd l${lv}" title="${vnDate(s)}${v ? ' · ' + (v - 1) + ' phút' : ''}"><span>${parse(s).getDate()}</span></div>`; }).join('');
    const recent = state.entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    $('#homeRecent').innerHTML = recent.length ? `<table><tr><th>Ngày</th><th>Chủ đề</th><th>Bài</th><th>Phút</th><th>Kết quả</th></tr>${recent.map(e => `<tr><td>${vnDate(e.date)}</td><td>${topicPill(e.topic)}</td><td>${e.code || ''}</td><td class="m">${e.minutes || ''}</td><td>${esc(e.result || '')}</td></tr>`).join('')}</table>` : '<p class="note">Chưa có buổi nào. Bấm "Bắt đầu" ở đồng hồ rồi làm bài của hôm nay.</p>';
  }

  /* ---------- Nhật ký ---------- */
  function renderLog() {
    const list = state.entries.filter(e => logFilter === 'all' || e.topic === logFilter).sort((a, b) => b.date.localeCompare(a.date));
    $('#logFilter').innerHTML = chips(logFilter, 'App.setLogFilter');
    $('#logTbl').innerHTML = `<tr><th>Ngày</th><th>Chủ đề</th><th>Bài</th><th>Phút</th><th>Kết quả</th><th>Tự chấm</th><th>Ghi chú / lỗi gặp</th><th></th></tr>` +
      (list.length ? list.map(e => `<tr data-id="${e.id}"><td style="white-space:nowrap">${vnDate(e.date)}</td><td>${topicPill(e.topic)}</td><td>${e.code || ''}</td>
        <td><input class="num" type="number" min="0" value="${e.minutes || ''}" data-f="minutes"></td>
        <td><input type="text" value="${esc(e.result || '')}" data-f="result" style="width:210px"></td>
        <td><select data-f="score"><option value=""></option>${[1, 2, 3, 4, 5].map(n => `<option ${String(e.score) === String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select></td>
        <td><input type="text" value="${esc(e.note || '')}" data-f="note" style="width:100%;min-width:180px"></td>
        <td><button class="ghost sm" data-del="${e.id}" title="Xóa">✕</button></td></tr>`).join('')
        : '<tr><td colspan="8" class="note">Chưa có dữ liệu.</td></tr>');
    $('#logTbl').querySelectorAll('[data-f]').forEach(inp => inp.onchange = () => {
      const id = inp.closest('tr').dataset.id, e = state.entries.find(x => x.id === id); if (!e) return;
      e[inp.dataset.f] = inp.dataset.f === 'minutes' ? Number(inp.value) || 0 : inp.value; persist(); renderStats();
    });
    $('#logTbl').querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const tr = b.closest('tr');
      if (b.dataset.armed) { state.entries = state.entries.filter(x => x.id !== b.dataset.del); persist(); renderLog(); return; }
      b.dataset.armed = '1'; b.textContent = 'Xóa?'; b.classList.add('danger'); tr.classList.add('warn');
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = '✕'; b.classList.remove('danger'); tr.classList.remove('warn'); } }, 3000);
    });
    renderStats();
  }
  function renderStats() {
    const mins = {}; Object.keys(TOPICS).forEach(k => mins[k] = 0); state.entries.forEach(e => { if (mins[e.topic] != null) mins[e.topic] += e.minutes || 0; });
    const mx = Math.max(1, ...Object.values(mins));
    $('#logStats').innerHTML = Object.keys(TOPICS).map(k => `<div class="sbar"><span>${TOPICS[k].name}</span><div><i style="width:${mins[k] / mx * 100}%;background:${TOPICS[k].color}"></i></div><b>${mins[k]} ph</b></div>`).join('');
  }
  function chips(cur, fn) {
    return [['all', 'Tất cả']].concat(Object.keys(TOPICS).map(k => [k, TOPICS[k].name])).map(([k, n]) => `<button class="chip ${cur === k ? 'on' : ''}" onclick="${fn}('${k}')">${n}</button>`).join('');
  }
  function download(name, text, type) {
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    catch (e) { toast('Trình duyệt chặn tải file'); }
  }
  function exportCsv() {
    const rows = [['Ngày', 'Chủ đề', 'Mã bài', 'Phút', 'Kết quả', 'Tự chấm', 'Ghi chú']].concat(state.entries.slice().sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, TOPICS[e.topic] ? TOPICS[e.topic].name : e.topic, e.code, e.minutes, e.result, e.score, e.note]));
    download(`nhat-ky-smt-${today()}.csv`, '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n'), 'text/csv');
  }
  const exportJson = () => download(`nhat-ky-smt-${today()}.json`, JSON.stringify(state, null, 2), 'application/json');
  function importJson(file) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result); if (!Array.isArray(d.entries)) throw 0;
        const have = new Set(state.entries.map(e => e.id)); let n = 0;
        d.entries.forEach(e => { if (e && e.date && !have.has(e.id)) { state.entries.push({ ...e, id: e.id || uid() }); n++; } });
        persist(); renderLog(); renderHome(); toast(`Đã nhập ${n} buổi`);
      } catch (e) { toast('File không đúng định dạng'); }
    };
    rd.readAsText(file);
  }

  /* ---------- Ngân hàng bài tập ---------- */
  function renderBank() {
    $('#bankFilter').innerHTML = chips(bankFilter, 'App.setBankFilter');
    const cnt = {}, last = {}; state.entries.forEach(e => { if (!e.code) return; cnt[e.code] = (cnt[e.code] || 0) + 1; if (e.date > (last[e.code] || '')) last[e.code] = e.date; });
    $('#bankTbl').innerHTML = `<tr><th>Mã</th><th>Chủ đề</th><th>Mức</th><th>Bài tập</th><th>Công cụ</th><th>Tiêu chí đạt</th><th>Đã làm</th><th></th></tr>` +
      BANK.filter(b => bankFilter === 'all' || b.topic === bankFilter).map(b => `<tr><td><b>${b.code}</b></td><td>${topicPill(b.topic)}</td><td>${b.level}</td><td style="min-width:260px">${esc(b.task)}</td><td>${esc(b.tools)}</td><td>${esc(b.pass)}</td>
      <td class="m">${cnt[b.code] ? `${cnt[b.code]}× <span class="note">${vnDate(last[b.code]).slice(3)}</span>` : '–'}</td><td><button class="ghost sm" onclick="App.openEntry({topic:'${b.topic}',code:'${b.code}'})">Ghi</button></td></tr>`).join('');
  }

  /* ---------- khởi động ---------- */
  function init() {
    load();
    $('#storeWarn').hidden = canSave;
    $('#fTopic').innerHTML = Object.keys(TOPICS).map(k => `<option value="${k}">${TOPICS[k].name}</option>`).join('');
    $('#fTopic').onchange = () => fillCodes($('#fTopic').value);
    $('#entryForm').onsubmit = submitEntry;
    $('#fCancel').onclick = () => $('#entryDlg').close();
    $('#tBtn').onclick = timerToggle; $('#tReset').onclick = timerReset;
    $('#expCsv').onclick = exportCsv; $('#expJson').onclick = exportJson;
    $('#impJson').onchange = e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; };
    $('#schedTbl').innerHTML = '<tr><th>Thứ</th><th>Chủ đề</th><th>Nội dung chính</th><th>Thời lượng</th><th>Công cụ</th></tr>' +
      [1, 2, 3, 4, 5, 6, 0].map(d => { const s = SCHEDULE[d]; return `<tr><td><b>${DOW[d]}</b></td><td>${s.topic ? topicPill(s.topic) : 'Nghỉ / bù'}</td><td>${esc(s.what)}</td><td>${s.time}</td><td>${esc(s.tools)}</td></tr>`; }).join('');
    document.querySelectorAll('nav button').forEach(b => b.onclick = () => { location.hash = b.dataset.route; });
    window.addEventListener('hashchange', route);
    renderCad(newSeed()); newAoi(newSeed()); newJud(newSeed());
    tick(); route();
  }
  return { init, openEntry, saveTool, setLogFilter: k => { logFilter = k; renderLog(); }, setBankFilter: k => { bankFilter = k; renderBank(); } };
})();
document.addEventListener('DOMContentLoaded', App.init);
