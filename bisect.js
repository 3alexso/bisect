(() => {
  function main() {
    const HOST_ID = 'wm-lib-version-host';
    document.getElementById(HOST_ID)?.remove();
    document.getElementById('wm-lib-version-panel')?.remove();

    const LIST_KEY = 'wm_libVersionList_v1';
    const STATUS_KEY = 'wm_libVersionStatus_v1';
    const GITLAB_PROJECT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/';
    const GITLAB_COMMIT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/-/commit/';

    let versions = null;
    try { versions = JSON.parse(localStorage.getItem(LIST_KEY)); } catch {}

    const loadStatus = () => { try { return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; } catch { return {}; } };
    const saveStatus = (s) => localStorage.setItem(STATUS_KEY, JSON.stringify(s));
    let status = loadStatus();

    const SCRIPT1_SOURCE = "(async () => {\n  const projectPath = 'walkme/engine/player/player';\n  const project = encodeURIComponent(projectPath);\n  const perPage = 100;\n\n  // Fetch commits on develop\n  const commitPages = 20; // 20 x 100 = 2000\n  let commits = [];\n  for (let page = 1; page <= commitPages; page++) {\n    const res = await fetch(\n      `https://gitlab.walkmernd.com/api/v4/projects/${project}/repository/commits?ref_name=develop&per_page=${perPage}&page=${page}`,\n      { credentials: 'include' }\n    );\n    const batch = await res.json();\n    if (!Array.isArray(batch) || batch.length === 0) break;\n    commits = commits.concat(batch);\n  }\n\n  // Fetch pipelines on develop with status=success, collect passed commit SHAs\n  const passedShas = new Set();\n  for (let page = 1; page <= 100; page++) {\n    const res = await fetch(\n      `https://gitlab.walkmernd.com/api/v4/projects/${project}/pipelines?ref=develop&status=success&per_page=${perPage}&page=${page}`,\n      { credentials: 'include' }\n    );\n    const batch = await res.json();\n    if (!Array.isArray(batch) || batch.length === 0) break;\n    batch.forEach(p => passedShas.add(p.sha));\n  }\n\n  // Keep only commits that have at least one passed pipeline\n  const passedCommits = commits.filter(c => passedShas.has(c.id));\n\n  const pad = (n) => String(n).padStart(2, '0');\n  const versions = passedCommits.map(c => {\n    const d = new Date(c.committed_date);\n    const Y = d.getUTCFullYear();\n    const Mo = pad(d.getUTCMonth() + 1);\n    const D = pad(d.getUTCDate());\n    const H = pad(d.getUTCHours());\n    const Mi = pad(d.getUTCMinutes());\n    const S = pad(d.getUTCSeconds());\n    return `${Y}${Mo}${D}-${H}${Mi}${S}-${c.short_id}-dev2`;\n  });\n\n  const payload = JSON.stringify(versions);\n  window.libVersions = versions;\n\n  const blob = new Blob([payload], { type: 'application/json' });\n  const url = URL.createObjectURL(blob);\n  const a = document.createElement('a');\n  a.href = url;\n  a.download = 'lib-versions.json';\n  document.body.appendChild(a);\n  a.click();\n  document.body.removeChild(a);\n  URL.revokeObjectURL(url);\n  console.log(`⬇️ Downloaded lib-versions.json with ${versions.length} passed-pipeline entries (out of ${commits.length} commits scanned).`);\n\n  try { await navigator.clipboard.writeText(payload); console.log('Also copied to clipboard.'); }\n  catch (e) { console.warn('Clipboard copy skipped:', e.name); }\n})();\n";

    async function copyToClipboard(text) {
      try { await navigator.clipboard.writeText(text); return true; } catch {}
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch { return false; }
    }

    function applyLibVersion(version) {
      window.localStorage.setItem('walkmePublicPath', `https://cdn.walkme.com/player/lib/${version}/`);
      window.localStorage.setItem('walkmeCustomeLibUrl', `https://cdn.walkme.com/player/lib/walkme_lib_${version}.js`);
    }

    function resetLibOverride() {
      window.localStorage.removeItem('walkmePublicPath');
      window.localStorage.removeItem('walkmeCustomeLibUrl');
    }

    function extractSha(version) {
      const m = version.match(/^\d{8}-\d{6}-([0-9a-f]+)-/);
      return m ? m[1] : version;
    }

    function suggestNext() {
      if (!versions) return null;
      let maxFailIdx = -1, minPassIdx = versions.length;
      versions.forEach((v, i) => {
        const s = status[v];
        if (s === 'failed' && i > maxFailIdx) maxFailIdx = i;
        if (s === 'passed' && i < minPassIdx) minPassIdx = i;
      });
      if (minPassIdx - maxFailIdx <= 1) return null;
      return { index: Math.floor((maxFailIdx + minPassIdx) / 2), version: versions[Math.floor((maxFailIdx + minPassIdx) / 2)] };
    }

    function findBroken() {
      if (!versions) return null;
      let maxFailIdx = -1, minPassIdx = versions.length;
      versions.forEach((v, i) => {
        const s = status[v];
        if (s === 'failed' && i > maxFailIdx) maxFailIdx = i;
        if (s === 'passed' && i < minPassIdx) minPassIdx = i;
      });
      if (maxFailIdx === -1) return null;
      if (minPassIdx - maxFailIdx === 1) return { index: maxFailIdx, version: versions[maxFailIdx] };
      return null;
    }

    async function pasteToGitlabConsole(btn) {
      window.open(GITLAB_PROJECT_URL, '_blank');
      const ok = await copyToClipboard(SCRIPT1_SOURCE);
      const original = 'Grab libs';
      btn.textContent = ok ? 'Copied — paste in console!' : 'Copy failed, try again';
      setTimeout(() => { btn.textContent = original; }, 2500);
    }

    const PANEL_STYLES = ":host { all: initial; }\n* { box-sizing: border-box; font-family: Menlo, Consolas, monospace; }\n.panel {\n  width: 480px; max-height: 85vh; min-width: 320px; min-height: 160px;\n  display: flex; flex-direction: column; position: relative;\n  background: #1e1e1e; color: #eee; font-size: 12px; line-height: 1.35;\n  border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.5);\n  overflow: hidden;\n}\n.panel.collapsed { height: auto !important; min-height: 0 !important; max-height: none !important; }\n.content { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }\n.panel.collapsed .content .scroll-area,\n.panel.collapsed .content .intake,\n.panel.collapsed .content .header-actions { display: none; }\n.header { flex: 0 0 auto; background: #111; padding: 6px 10px; border-bottom: 1px solid #444; cursor: move; }\n.header-top { display: flex; flex-wrap: nowrap; justify-content: space-between; align-items: center; gap: 6px; }\n.header-top .title-group { display: flex; align-items: center; gap: 5px; min-width: 0; flex: 1 1 auto; overflow: hidden; }\n.header-top strong { color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.header-btns { display: flex; gap: 5px; flex: 0 0 auto; }\n.header-btns button { flex-shrink: 0; }\n.header-actions { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }\nbutton {\n  all: unset;\n  background: #333; color: #eee; border: 1px solid #555;\n  border-radius: 4px; padding: 3px 7px; cursor: pointer; font-size: 11px;\n  display: inline-block; text-align: center;\n}\nbutton:hover { background: #444; }\nbutton.icon-btn { padding: 3px 8px; font-weight: 700; }\nbutton.gitlab-btn { background: #6e49cb; border-color: #7b52e0; }\nbutton.gitlab-btn:hover { background: #7b52e0; }\nbutton.apply-btn { background: #2e7d32; border-color: #388e3c; }\nbutton.apply-btn:hover { background: #388e3c; }\nbutton.reset-lib-btn { background: #8a5a00; border-color: #a56d00; }\nbutton.reset-lib-btn:hover { background: #a56d00; }\n.suggest {\n  flex: 0 0 auto; padding: 6px 10px; background: #2a2a2a; border-bottom: 1px solid #444;\n  color: #ddd; display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;\n}\n.suggest button { flex: 0 0 auto; background: #1565c0; border-color: #1976d2; }\n.suggest button:hover { background: #1976d2; }\n.suggest.broken { background: #4a1414; border-bottom-color: #b3261e; color: #ffb3b3; }\n.suggest.broken button { background: #b3261e; border-color: #d32f2f; }\n.suggest.broken button:hover { background: #d32f2f; }\n.suggest .btn-group { display: flex; gap: 5px; }\n.scroll-area { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }\ntable { width: 100%; border-collapse: separate; border-spacing: 0; }\nth {\n  text-align: left; padding: 4px 8px; background: #2a2a2a; color: #ccc;\n  position: sticky; top: 0; z-index: 1; border-bottom: 1px solid #444;\n}\ntd { padding: 3px 8px; border-bottom: 1px solid #333; color: #eee; }\n.row-num-cell { text-align: left; white-space: nowrap; color: #888; width: 2.5em; }\n.version-cell { word-break: break-all; }\n.apply-cell, .status-cell { text-align: center; white-space: nowrap; }\n.status-cell button { margin-right: 3px; opacity: 0.6; }\n.status-cell button.active { opacity: 1; }\ntr.jump-highlight { background: #ffb30055 !important; transition: background 0.3s; }\ntr.broken-row { background: #b3261e !important; }\ntr.broken-row td { color: #fff; font-weight: 600; }\ntr.broken-row .row-num-cell { color: #ffd6d6; }\np { color: inherit; margin: 0 0 8px; }\n.intake { padding: 12px; }\n.intake-msg { margin-top: 8px; color: #f66; }\n.resize-handle {\n  position: absolute; left: 0; bottom: 0; width: 14px; height: 14px;\n  cursor: nesw-resize;\n  background: linear-gradient(45deg, transparent 0 40%, #777 40% 55%, transparent 55% 70%, #777 70% 85%, transparent 85% 100%);\n}\n";

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.top = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PANEL_STYLES;
    shadow.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'panel';
    shadow.appendChild(panel);

    const content = document.createElement('div');
    content.className = 'content';
    panel.appendChild(content);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    panel.appendChild(resizeHandle);

    let resizeStart = null;
    resizeHandle.onmousedown = (e) => {
      e.preventDefault();
      const rect = panel.getBoundingClientRect();
      resizeStart = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
    };
    document.addEventListener('mousemove', (e) => {
      if (!resizeStart) return;
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const maxW = window.innerWidth * 0.9;
      const newW = Math.min(maxW, Math.max(320, resizeStart.w - dx));
      const newH = Math.max(160, resizeStart.h + dy);
      panel.style.width = newW + 'px';
      panel.style.height = newH + 'px';
    });
    document.addEventListener('mouseup', () => { resizeStart = null; });

    function attachDrag() {
      const header = content.querySelector('#wm-header');
      let dragOffset = null;
      header.onmousedown = (e) => {
        if (e.target.closest('button')) return;
        dragOffset = { x: e.clientX - host.offsetLeft, y: e.clientY - host.offsetTop };
      };
      document.onmousemove = (e) => {
        if (!dragOffset) return;
        host.style.left = (e.clientX - dragOffset.x) + 'px';
        host.style.top = (e.clientY - dragOffset.y) + 'px';
        host.style.right = 'auto';
      };
      document.onmouseup = () => dragOffset = null;
    }

    function expandPanel() {
      panel.classList.remove('collapsed');
      const btn = content.querySelector('#wm-collapse');
      if (btn) btn.textContent = '▲';
    }

    function attachCollapse() {
      content.querySelector('#wm-collapse').onclick = (e) => {
        panel.classList.toggle('collapsed');
        e.target.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
      };
    }

    function renderIntake() {
      content.innerHTML = `
        <div class="header" id="wm-header">
          <div class="header-top">
            <div class="title-group"><strong>Lib Version Bisect</strong></div>
            <div class="header-btns">
              <button id="wm-collapse" class="icon-btn">▲</button>
              <button id="wm-close" class="icon-btn">✕</button>
            </div>
          </div>
        </div>
        <div class="intake">
          <p>No version list loaded yet.</p>
          <button id="wm-gitlab-console" class="gitlab-btn" title="Paste to devtools">Grab libs</button>
          <button id="wm-load-file">Load from file</button>
          <button id="wm-paste-manual">Paste manually</button>
          <input type="file" id="wm-file-input" accept="application/json,.json" style="display:none;">
          <p class="intake-msg" id="wm-intake-msg"></p>
        </div>
      `;
      content.querySelector('#wm-close').onclick = () => host.remove();
      content.querySelector('#wm-gitlab-console').onclick = (e) => pasteToGitlabConsole(e.target);

      const fileInput = content.querySelector('#wm-file-input');
      content.querySelector('#wm-load-file').onclick = () => fileInput.click();
      fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            if (!Array.isArray(parsed) || !parsed.every(v => typeof v === 'string')) throw new Error('bad shape');
            versions = parsed;
            localStorage.setItem(LIST_KEY, JSON.stringify(versions));
            renderTable();
          } catch (e) {
            content.querySelector('#wm-intake-msg').textContent = 'Could not parse that file: ' + e.message;
          }
        };
        reader.readAsText(file);
      };

      content.querySelector('#wm-paste-manual').onclick = () => {
        const pasted = prompt('Paste the lib version list:');
        if (!pasted) return;
        try { versions = JSON.parse(pasted); }
        catch { versions = pasted.split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
        if (!Array.isArray(versions) || !versions.length) {
          content.querySelector('#wm-intake-msg').textContent = 'Could not parse that input.';
          return;
        }
        localStorage.setItem(LIST_KEY, JSON.stringify(versions));
        renderTable();
      };
      attachDrag();
      attachCollapse();
    }

    function renderTable() {
      content.innerHTML = `
        <div class="header" id="wm-header">
          <div class="header-top">
            <div class="title-group">
              <strong id="wm-title">Lib Versions</strong>
            </div>
            <div class="header-btns">
              <button id="wm-gitlab-console" class="gitlab-btn" title="Paste to devtools">Grab libs</button>
              <button id="wm-reload">Reload list</button>
              <button id="wm-collapse" class="icon-btn">▲</button>
              <button id="wm-close" class="icon-btn">✕</button>
            </div>
          </div>
          <div class="header-actions">
            <button id="wm-reset">Reset marks</button>
            <button id="wm-reset-lib" class="reset-lib-btn">Reset lib</button>
          </div>
        </div>
        <div class="suggest" id="wm-suggest"></div>
        <div class="scroll-area">
          <table>
            <thead><tr>
              <th class="row-num-cell">#</th>
              <th>Version</th>
              <th style="text-align:center;">Apply</th>
              <th style="text-align:center;">Status</th>
            </tr></thead>
            <tbody id="wm-tbody"></tbody>
          </table>
        </div>
      `;

      const tbody = content.querySelector('#wm-tbody');
      const titleEl = content.querySelector('#wm-title');
      const suggestEl = content.querySelector('#wm-suggest');

      content.querySelector('#wm-gitlab-console').onclick = (e) => pasteToGitlabConsole(e.target);

      function renderTitle() {
        const passed = Object.values(status).filter(s => s === 'passed').length;
        const failed = Object.values(status).filter(s => s === 'failed').length;
        titleEl.textContent = `Lib Versions (${versions.length} | ✅ ${passed} ❌ ${failed} ⬜ ${versions.length - passed - failed})`;
      }

      function renderSuggestion() {
        const broken = findBroken();
        if (broken) {
          const sha = extractSha(broken.version);
          suggestEl.className = 'suggest broken';
          suggestEl.innerHTML = `
            <span>🔴 Broken commit found (row ${broken.index + 1}): <b>${broken.version}</b></span>
            <div class="btn-group">
              <button id="wm-broken-copy">Copy SHA</button>
              <button id="wm-broken-goto">Broken commit</button>
            </div>
          `;
          suggestEl.querySelector('#wm-broken-copy').onclick = async (e) => {
            const ok = await copyToClipboard(sha);
            e.target.textContent = ok ? 'Copied!' : 'Failed';
            setTimeout(() => { e.target.textContent = 'Copy SHA'; }, 1200);
          };
          suggestEl.querySelector('#wm-broken-goto').onclick = () => {
            window.open(GITLAB_COMMIT_URL + sha, '_blank');
          };
          return;
        }
        suggestEl.className = 'suggest';
        const s = suggestNext();
        if (!s) {
          suggestEl.innerHTML = `<span>${Object.keys(status).length
            ? 'Not enough data yet, or bisect complete.'
            : 'Mark the newest version as Fail and a known-good older version as Pass to start bisecting.'}</span>`;
          return;
        }
        suggestEl.innerHTML = `
          <span>Next to test (row ${s.index + 1}): <b>${s.version}</b></span>
          <button id="wm-jump">Jump to it</button>
        `;
        suggestEl.querySelector('#wm-jump').onclick = () => jumpToSuggested();
      }

      function jumpToSuggested() {
        const s = suggestNext();
        if (!s) return;
        expandPanel();
        const row = tbody.querySelector(`tr[data-index="${s.index}"]`);
        if (!row) return;
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        row.classList.add('jump-highlight');
        setTimeout(() => row.classList.remove('jump-highlight'), 1500);
      }

      function renderRows() {
        const broken = findBroken();
        tbody.innerHTML = '';
        versions.forEach((v, i) => {
          const st = status[v] || '';
          const isBroken = broken && broken.index === i;
          const tr = document.createElement('tr');
          tr.dataset.index = i;
          if (isBroken) {
            tr.classList.add('broken-row');
          } else {
            tr.style.background = st === 'passed' ? '#2e7d3222' : st === 'failed' ? '#c6282822' : '';
          }

          const tdNum = document.createElement('td');
          tdNum.className = 'row-num-cell';
          tdNum.textContent = i + 1;

          const tdVersion = document.createElement('td');
          tdVersion.className = 'version-cell';
          tdVersion.textContent = v + (isBroken ? ' 🔴' : '');

          const tdApply = document.createElement('td');
          tdApply.className = 'apply-cell';
          const applyBtn = document.createElement('button');
          applyBtn.className = 'apply-btn';
          applyBtn.textContent = 'Apply';
          applyBtn.onclick = () => {
            applyLibVersion(v);
            location.reload();
          };
          tdApply.appendChild(applyBtn);

          const tdStatus = document.createElement('td');
          tdStatus.className = 'status-cell';

          const passBtn = document.createElement('button');
          passBtn.textContent = 'Pass';
          const failBtn = document.createElement('button');
          failBtn.textContent = 'Fail';
          if (st === 'passed') passBtn.classList.add('active');
          if (st === 'failed') failBtn.classList.add('active');

          passBtn.onclick = () => {
            status[v] = status[v] === 'passed' ? '' : 'passed';
            if (!status[v]) delete status[v];
            saveStatus(status); renderRows(); renderTitle(); renderSuggestion();
          };
          failBtn.onclick = () => {
            status[v] = status[v] === 'failed' ? '' : 'failed';
            if (!status[v]) delete status[v];
            saveStatus(status); renderRows(); renderTitle(); renderSuggestion();
          };

          tdStatus.appendChild(passBtn);
          tdStatus.appendChild(failBtn);
          tr.appendChild(tdNum);
          tr.appendChild(tdVersion);
          tr.appendChild(tdApply);
          tr.appendChild(tdStatus);
          tbody.appendChild(tr);
        });
      }

      content.querySelector('#wm-close').onclick = () => host.remove();
      content.querySelector('#wm-reset').onclick = () => {
        if (confirm('Clear all saved pass/fail marks?')) {
          status = {}; saveStatus(status); renderRows(); renderTitle(); renderSuggestion();
        }
      };
      content.querySelector('#wm-reset-lib').onclick = () => {
        if (confirm('Remove the applied lib override (walkmePublicPath / walkmeCustomeLibUrl)? Reload the page now to take effect?')) {
          resetLibOverride();
          location.reload();
        } else {
          resetLibOverride();
        }
      };
      content.querySelector('#wm-reload').onclick = () => {
        if (confirm('Forget the saved list AND all pass/fail marks?')) {
          localStorage.removeItem(LIST_KEY);
          localStorage.removeItem(STATUS_KEY);
          versions = null;
          status = {};
          renderIntake();
        }
      };

      attachDrag();
      attachCollapse();
      renderRows(); renderTitle(); renderSuggestion();
    }

    if (Array.isArray(versions) && versions.length) renderTable();
    else renderIntake();
  }

  main();
})();
