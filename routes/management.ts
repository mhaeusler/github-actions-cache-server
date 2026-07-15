const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>Cache Control Room</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0d1117;
        --panel: #151c25;
        --panel-raised: #1b2531;
        --line: #293646;
        --text: #edf4fb;
        --muted: #8fa1b5;
        --accent: #79e2b0;
        --accent-strong: #37c889;
        --blue: #7db7ff;
        --warning: #f4c46d;
        --danger: #ff8d8d;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-width: 320px;
        color: var(--text);
        background: radial-gradient(circle at 90% -20%, #203c4b 0, transparent 42%), var(--bg);
      }
      button, input { font: inherit; }
      button { cursor: pointer; }
      .shell { width: min(1440px, calc(100% - 40px)); margin: 0 auto; padding: 32px 0 52px; }
      .topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
      .eyebrow { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
      h1 { margin: 8px 0 6px; font-size: clamp(30px, 5vw, 48px); letter-spacing: -.045em; line-height: 1; }
      .subtitle { margin: 0; color: var(--muted); font-size: 15px; }
      .actions { display: flex; align-items: center; gap: 10px; }
      .button, .key-form button {
        border: 1px solid #3c5362;
        border-radius: 10px;
        padding: 10px 14px;
        color: #07130f;
        background: var(--accent);
        font-weight: 750;
      }
      .button.secondary { color: var(--text); background: var(--panel); }
      .button:disabled { cursor: wait; opacity: .6; }
      .status { display: inline-flex; align-items: center; gap: 7px; color: var(--muted); font-size: 13px; }
      .status::before { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); content: ""; }
      .status.online::before { background: var(--accent-strong); box-shadow: 0 0 12px var(--accent-strong); }
      .status.error::before { background: var(--danger); }
      .grid { display: grid; gap: 16px; }
      .summary-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 16px; }
      .panel { min-width: 0; border: 1px solid var(--line); border-radius: 16px; background: color-mix(in srgb, var(--panel) 92%, transparent); box-shadow: 0 16px 40px #0000001c; }
      .stat { padding: 20px; }
      .stat-label { color: var(--muted); font-size: 13px; }
      .stat-value { margin: 12px 0 7px; font-size: clamp(25px, 3vw, 34px); font-weight: 720; letter-spacing: -.04em; }
      .stat-detail { color: var(--muted); font-size: 12px; }
      .accent { color: var(--accent); }
      .main-grid { grid-template-columns: minmax(0, 1.35fr) minmax(360px, .65fr); align-items: start; }
      .panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 19px 20px 15px; }
      .panel-title { margin: 0; font-size: 15px; letter-spacing: -.01em; }
      .panel-meta { color: var(--muted); font-size: 12px; }
      .panel-body { padding: 0 20px 20px; }
      .stack { display: grid; gap: 16px; }
      .storage-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 20px; padding: 4px 0 18px; }
      .storage-value { font-size: 30px; font-weight: 720; letter-spacing: -.04em; }
      .storage-caption { color: var(--muted); font-size: 12px; }
      .progress { height: 10px; overflow: hidden; border-radius: 99px; background: #293642; }
      .progress > span { display: block; width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-strong), var(--blue)); transition: width .3s ease; }
      .metric-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .metric { padding: 12px; border: 1px solid var(--line); border-radius: 11px; background: #111821; }
      .metric strong { display: block; margin-bottom: 5px; font-size: 18px; }
      .metric span { color: var(--muted); font-size: 11px; }
      .breakdown { display: grid; gap: 13px; }
      .breakdown-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: center; }
      .breakdown-name { overflow: hidden; color: var(--text); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
      .breakdown-value { color: var(--muted); font-size: 12px; white-space: nowrap; }
      .bar { height: 5px; margin-top: 6px; overflow: hidden; border-radius: 99px; background: #293642; }
      .bar > span { display: block; width: 0; height: 100%; border-radius: inherit; background: var(--blue); }
      .table-panel { overflow: hidden; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 13px 20px; border-top: 1px solid var(--line); text-align: left; white-space: nowrap; }
      th { color: var(--muted); font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
      td { color: #dce6ef; }
      td.muted { color: var(--muted); }
      .key-form { display: flex; gap: 8px; padding: 14px; border: 1px solid var(--line); border-radius: 13px; background: var(--panel); }
      .key-form input { width: min(260px, 40vw); border: 1px solid var(--line); border-radius: 8px; padding: 9px 11px; color: var(--text); background: #0e141b; outline: none; }
      .key-form input:focus { border-color: var(--accent-strong); }
      .auth { display: grid; justify-items: center; gap: 18px; max-width: 580px; margin: 96px auto; padding: 36px; text-align: center; }
      .auth h2 { margin: 0; font-size: 25px; }
      .auth p { margin: 0; color: var(--muted); line-height: 1.6; }
      .auth .key-form { margin-top: 4px; }
      .notice { display: none; margin-bottom: 16px; padding: 13px 16px; border: 1px solid #724047; border-radius: 11px; color: #ffc4c4; background: #3a1d25; }
      .empty { padding: 25px 20px; color: var(--muted); text-align: center; }
      .hidden { display: none !important; }
      @media (max-width: 1000px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } .main-grid { grid-template-columns: 1fr; } }
      @media (max-width: 600px) { .shell { width: min(100% - 24px, 1440px); padding-top: 20px; } .topbar { display: block; } .actions { margin-top: 18px; justify-content: space-between; } .summary-grid { grid-template-columns: 1fr; } .metric-list { grid-template-columns: 1fr 1fr; } .auth { margin: 50px auto; padding: 24px 16px; } .key-form { width: 100%; } .key-form input { width: 100%; } }
    </style>
  </head>
  <body>
    <main class="shell">
      <section id="auth" class="panel auth">
        <div class="eyebrow">Management console</div>
        <h2>Connect to your cache server</h2>
        <p>The dashboard uses the management API. Enter the configured management API key to view operational data in this browser session.</p>
        <form id="key-form" class="key-form">
          <input id="api-key" type="password" autocomplete="off" placeholder="Management API key" aria-label="Management API key" required />
          <button type="submit">Open dashboard</button>
        </form>
        <span id="auth-error" class="status error hidden">Unable to connect</span>
      </section>

      <section id="dashboard" class="hidden">
        <header class="topbar">
          <div>
            <div class="eyebrow">Cache control room</div>
            <h1>Server overview</h1>
            <p class="subtitle">A compact view of cache health, storage, and recent activity.</p>
          </div>
          <div class="actions">
            <span id="status" class="status">Waiting for data</span>
            <button id="refresh" class="button secondary" type="button">Refresh</button>
            <button id="forget" class="button secondary" type="button">Forget key</button>
          </div>
        </header>
        <div id="notice" class="notice"></div>

        <div class="grid summary-grid">
          <article class="panel stat"><div class="stat-label">Cache entries</div><div id="cache-entries" class="stat-value">—</div><div id="cache-entries-detail" class="stat-detail">Finalized entries</div></article>
          <article class="panel stat"><div class="stat-label">Tracked storage</div><div id="storage-bytes" class="stat-value">—</div><div id="storage-detail" class="stat-detail">Across storage locations</div></article>
          <article class="panel stat"><div class="stat-label">Cache hit rate</div><div id="hit-rate" class="stat-value accent">—</div><div id="request-detail" class="stat-detail">Since this process started</div></article>
          <article class="panel stat"><div class="stat-label">Active uploads</div><div id="active-uploads" class="stat-value">—</div><div id="server-detail" class="stat-detail">Server —</div></article>
        </div>

        <div class="grid main-grid">
          <div class="stack">
            <section class="panel">
              <div class="panel-header"><h2 class="panel-title">Storage health</h2><span id="storage-updated" class="panel-meta">—</span></div>
              <div class="panel-body">
                <div class="storage-summary"><div><div id="storage-big" class="storage-value">—</div><div class="storage-caption">Recorded payload size</div></div><div id="tracked-percent" class="storage-caption">—% tracked</div></div>
                <div class="progress" aria-label="Tracked storage locations"><span id="tracked-progress"></span></div>
                <div class="metric-list" style="margin-top: 16px"><div class="metric"><strong id="location-count">—</strong><span>Storage locations</span></div><div class="metric"><strong id="merged-count">—</strong><span>Merged locations</span></div><div class="metric"><strong id="pending-count">—</strong><span>Pending merges</span></div><div class="metric"><strong id="downloaded-count">—</strong><span>Accessed locations</span></div><div class="metric"><strong id="tracked-count">—</strong><span>Size tracked</span></div><div class="metric"><strong id="upload-count">—</strong><span>Uploads in flight</span></div></div>
              </div>
            </section>
            <section class="panel table-panel">
              <div class="panel-header"><h2 class="panel-title">Recent cache entries</h2><span class="panel-meta">Latest updates</span></div>
              <div class="table-wrap"><table><thead><tr><th>Key</th><th>Scope</th><th>Repository</th><th>Size</th><th>Updated</th></tr></thead><tbody id="recent-entries"></tbody></table></div>
            </section>
            <section class="panel table-panel">
              <div class="panel-header"><h2 class="panel-title">Uploads in flight</h2><span class="panel-meta">Newest first</span></div>
              <div class="table-wrap"><table><thead><tr><th>Key</th><th>Scope</th><th>Parts</th><th>Started</th></tr></thead><tbody id="active-uploads-table"></tbody></table></div>
            </section>
          </div>

          <div class="stack">
            <section class="panel"><div class="panel-header"><h2 class="panel-title">Traffic</h2><span class="panel-meta">Prometheus counters</span></div><div class="panel-body"><div class="metric-list"><div class="metric"><strong id="hits">—</strong><span>Cache hits</span></div><div class="metric"><strong id="misses">—</strong><span>Cache misses</span></div><div class="metric"><strong id="requests">—</strong><span>Total requests</span></div></div></div></section>
            <section class="panel"><div class="panel-header"><h2 class="panel-title">Top scopes</h2><span class="panel-meta">By entry count</span></div><div id="scopes" class="panel-body breakdown"></div></section>
            <section class="panel"><div class="panel-header"><h2 class="panel-title">Top repositories</h2><span class="panel-meta">By entry count</span></div><div id="repositories" class="panel-body breakdown"></div></section>
          </div>
        </div>
      </section>
    </main>
    <script>
      (() => {
        const keyStorage = 'github-actions-cache-server.management-api-key';
        const auth = document.querySelector('#auth');
        const dashboard = document.querySelector('#dashboard');
        const keyForm = document.querySelector('#key-form');
        const keyInput = document.querySelector('#api-key');
        const authError = document.querySelector('#auth-error');
        const notice = document.querySelector('#notice');
        const status = document.querySelector('#status');
        const refreshButton = document.querySelector('#refresh');
        const number = new Intl.NumberFormat();
        const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
        const formatNumber = (value) => number.format(Number(value || 0));
        const formatBytes = (value) => {
          const bytes = Number(value || 0);
          if (bytes < 1024) return bytes + ' B';
          const units = ['KB', 'MB', 'GB', 'TB'];
          let amount = bytes;
          let unit = 'B';
          for (const nextUnit of units) { amount /= 1024; unit = nextUnit; if (amount < 1024) break; }
          return (amount >= 100 ? amount.toFixed(0) : amount >= 10 ? amount.toFixed(1) : amount.toFixed(2)) + ' ' + unit;
        };
        const formatDate = (value) => value ? date.format(new Date(Number(value))) : '—';
        const setText = (selector, value) => { document.querySelector(selector).textContent = value; };
        const setStatus = (message, state = '') => { status.textContent = message; status.className = 'status ' + state; };
        const renderBreakdown = (selector, rows) => {
          const element = document.querySelector(selector);
          if (!rows.length) { element.innerHTML = '<div class="empty">No data yet</div>'; return; }
          const maximum = Math.max(...rows.map((row) => row.entries), 1);
          element.innerHTML = rows.map((row) => '<div class="breakdown-row"><div><div class="breakdown-name" title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</div><div class="bar"><span style="width: ' + (row.entries / maximum * 100) + '%"></span></div></div><div class="breakdown-value">' + formatNumber(row.entries) + ' · ' + formatBytes(row.bytes) + '</div></div>').join('');
        };
        const parseMetric = (text, name, labels = '') => {
          const line = text.split('\n').find((item) => item.startsWith(name + labels + ' '));
          return line ? Number(line.slice((name + labels + ' ').length)) : 0;
        };
        const renderMetrics = (text) => {
          const hits = parseMetric(text, 'cache_requests_total', '{result="hit"}');
          const misses = parseMetric(text, 'cache_requests_total', '{result="miss"}');
          setText('#hits', formatNumber(hits)); setText('#misses', formatNumber(misses)); setText('#requests', formatNumber(hits + misses));
          setText('#hit-rate', hits + misses ? ((hits / (hits + misses)) * 100).toFixed(1) + '%' : '—');
          setText('#request-detail', formatNumber(hits + misses) + ' total cache requests');
        };
        const render = (data) => {
          const storage = data.storage;
          setText('#cache-entries', formatNumber(data.cacheEntries.total));
          setText('#cache-entries-detail', formatNumber(storage.locations) + ' storage locations');
          setText('#storage-bytes', formatBytes(storage.bytes)); setText('#storage-big', formatBytes(storage.bytes));
          setText('#storage-detail', formatNumber(storage.sizeTrackedLocations) + ' of ' + formatNumber(storage.locations) + ' locations tracked');
          setText('#active-uploads', formatNumber(data.uploads.total)); setText('#upload-count', formatNumber(data.uploads.total));
          setText('#server-detail', data.server.version + ' · ' + data.server.databaseDriver + ' / ' + data.server.storageDriver);
          setText('#storage-updated', 'Updated ' + formatDate(data.generatedAt));
          const trackedPercent = storage.locations ? Math.round(storage.sizeTrackedLocations / storage.locations * 100) : 100;
          setText('#tracked-percent', trackedPercent + '% tracked'); document.querySelector('#tracked-progress').style.width = trackedPercent + '%';
          setText('#location-count', formatNumber(storage.locations)); setText('#merged-count', formatNumber(storage.mergedLocations)); setText('#pending-count', formatNumber(storage.pendingMerges)); setText('#downloaded-count', formatNumber(storage.downloadedLocations)); setText('#tracked-count', formatNumber(storage.sizeTrackedLocations));
          renderBreakdown('#scopes', data.topScopes); renderBreakdown('#repositories', data.topRepositories);
          const recent = document.querySelector('#recent-entries');
          recent.innerHTML = data.recentEntries.length ? data.recentEntries.map((entry) => '<tr><td title="' + escapeHtml(entry.key) + '">' + escapeHtml(entry.key) + '</td><td>' + escapeHtml(entry.scope) + '</td><td>' + escapeHtml(entry.repoId) + '</td><td>' + formatBytes(entry.sizeBytes) + '</td><td class="muted">' + formatDate(entry.updatedAt) + '</td></tr>').join('') : '<tr><td colspan="5" class="empty">No cache entries yet</td></tr>';
          const uploads = document.querySelector('#active-uploads-table');
          uploads.innerHTML = data.activeUploads.length ? data.activeUploads.map((upload) => '<tr><td title="' + escapeHtml(upload.key) + '">' + escapeHtml(upload.key) + '</td><td>' + escapeHtml(upload.scope) + '</td><td>' + formatNumber(upload.finishedPartUploadCount) + ' / ' + formatNumber(upload.startedPartUploadCount) + '</td><td class="muted">' + formatDate(upload.createdAt) + '</td></tr>').join('') : '<tr><td colspan="4" class="empty">No uploads in flight</td></tr>';
        };
        const fetchDashboard = async () => {
          const apiKey = sessionStorage.getItem(keyStorage);
          if (!apiKey) return;
          refreshButton.disabled = true; setStatus('Refreshing…'); notice.style.display = 'none';
          try {
            const headers = { 'X-Api-Key': apiKey };
            const [overviewResponse, metricsResponse] = await Promise.all([fetch('/management-api/overview/', { headers }), fetch('/metrics')]);
            if (!overviewResponse.ok) throw new Error(overviewResponse.status === 401 ? 'The API key was rejected.' : 'The management API returned HTTP ' + overviewResponse.status + '.');
            render(await overviewResponse.json()); renderMetrics(await metricsResponse.text());
            setStatus('Live', 'online');
          } catch (error) {
            setStatus('Connection error', 'error'); notice.textContent = error.message || 'Unable to load dashboard data.'; notice.style.display = 'block';
            if (error.message && error.message.includes('rejected')) { sessionStorage.removeItem(keyStorage); dashboard.classList.add('hidden'); auth.classList.remove('hidden'); authError.textContent = error.message; authError.classList.remove('hidden'); keyInput.focus(); }
          } finally { refreshButton.disabled = false; }
        };
        keyForm.addEventListener('submit', (event) => { event.preventDefault(); sessionStorage.setItem(keyStorage, keyInput.value); auth.classList.add('hidden'); dashboard.classList.remove('hidden'); authError.classList.add('hidden'); fetchDashboard(); });
        refreshButton.addEventListener('click', fetchDashboard);
        document.querySelector('#forget').addEventListener('click', () => { sessionStorage.removeItem(keyStorage); dashboard.classList.add('hidden'); auth.classList.remove('hidden'); keyInput.value = ''; keyInput.focus(); });
        if (sessionStorage.getItem(keyStorage)) { auth.classList.add('hidden'); dashboard.classList.remove('hidden'); fetchDashboard(); }
      })();
    </script>
  </body>
</html>`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return page
})
