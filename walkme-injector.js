(() => {
  const HOST_ID = 'wm-injector-host';
  document.getElementById(HOST_ID)?.remove();

  const QA_DEPLOY_HISTORY_URL = 'https://eux-prod.walkmernd.com/playerDeployment/deployHistory';
  const GITLAB_PROJECT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/';

  const SCRIPT1_SOURCE = [
    "(async () => {",
    "  const projectPath = 'walkme/engine/player/player';",
    "  const project = encodeURIComponent(projectPath);",
    "  const perPage = 100;",
    "",
    "  // Fetch commits on develop",
    "  const commitPages = 20; // 20 x 100 = 2000",
    "  let commits = [];",
    "  for (let page = 1; page <= commitPages; page++) {",
    "    const res = await fetch(",
    "      `https://gitlab.walkmernd.com/api/v4/projects/${project}/repository/commits?ref_name=develop&per_page=${perPage}&page=${page}`,",
    "      { credentials: 'include' }",
    "    );",
    "    const batch = await res.json();",
    "    if (!Array.isArray(batch) || batch.length === 0) break;",
    "    commits = commits.concat(batch);",
    "  }",
    "",
    "  // Fetch pipelines on develop with status=success, collect passed commit SHAs",
    "  const passedShas = new Set();",
    "  for (let page = 1; page <= 100; page++) {",
    "    const res = await fetch(",
    "      `https://gitlab.walkmernd.com/api/v4/projects/${project}/pipelines?ref=develop&status=success&per_page=${perPage}&page=${page}`,",
    "      { credentials: 'include' }",
    "    );",
    "    const batch = await res.json();",
    "    if (!Array.isArray(batch) || batch.length === 0) break;",
    "    batch.forEach(p => passedShas.add(p.sha));",
    "  }",
    "",
    "  // Keep only commits that have at least one passed pipeline",
    "  const passedCommits = commits.filter(c => passedShas.has(c.id));",
    "",
    "  const pad = (n) => String(n).padStart(2, '0');",
    "  const versions = passedCommits.map(c => {",
    "    const d = new Date(c.committed_date);",
    "    const Y = d.getUTCFullYear();",
    "    const Mo = pad(d.getUTCMonth() + 1);",
    "    const D = pad(d.getUTCDate());",
    "    const H = pad(d.getUTCHours());",
    "    const Mi = pad(d.getUTCMinutes());",
    "    const S = pad(d.getUTCSeconds());",
    "    return `${Y}${Mo}${D}-${H}${Mi}${S}-${c.short_id}-dev2`;",
    "  });",
    "",
    "  const payload = JSON.stringify(versions);",
    "  window.libVersions = versions;",
    "",
    "  const blob = new Blob([payload], { type: 'application/json' });",
    "  const url = URL.createObjectURL(blob);",
    "  const a = document.createElement('a');",
    "  a.href = url;",
    "  a.download = 'lib-versions.json';",
    "  document.body.appendChild(a);",
    "  a.click();",
    "  document.body.removeChild(a);",
    "  URL.revokeObjectURL(url);",
    "  console.log(`⬇️ Downloaded lib-versions.json with ${versions.length} passed-pipeline entries (out of ${commits.length} commits scanned).`);",
    "",
    "  try { await navigator.clipboard.writeText(payload); console.log('Also copied to clipboard.'); }",
    "  catch (e) { console.warn('Clipboard copy skipped:', e.name); }",
    "})();",
  ].join('\n');

  const SCRIPT2_QA_SOURCE = [
    "(function() {",
    "  const versionRe = /^\\d{8}-\\d{6}-[0-9a-f]+$/i;",
    "  const rows = Array.from(document.querySelectorAll('table tr'));",
    "  const seen = new Set();",
    "  const versions = [];",
    "",
    "  rows.forEach(row => {",
    "    const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim());",
    "    if (!cells.length) return;",
    "    const version = cells[0];",
    "    const branch = (cells[1] || '').toLowerCase();",
    "    if (versionRe.test(version) && (!branch || branch === 'qa') && !seen.has(version)) {",
    "      seen.add(version);",
    "      versions.push(version);",
    "    }",
    "  });",
    "",
    "  const payload = JSON.stringify(versions);",
    "  window.libVersionsQA = versions;",
    "",
    "  const blob = new Blob([payload], { type: 'application/json' });",
    "  const url = URL.createObjectURL(blob);",
    "  const a = document.createElement('a');",
    "  a.href = url;",
    "  a.download = 'lib-versions-qa.json';",
    "  document.body.appendChild(a);",
    "  a.click();",
    "  document.body.removeChild(a);",
    "  URL.revokeObjectURL(url);",
    "  console.log(`⬇️ Downloaded lib-versions-qa.json with ${versions.length} entries (only rows currently rendered in the table are scanned).`);",
    "",
    "  navigator.clipboard.writeText(payload)",
    "    .then(() => console.log('Also copied to clipboard.'))",
    "    .catch(e => console.warn('Clipboard copy skipped:', e.name));",
    "})();",
  ].join('\n');

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

  function buildUrl(domain, guid, segment) {
    const seg = segment ? `${segment}/` : '';
    return `https://${domain}/users/${guid}/${seg}walkme_${guid}_https.js`;
  }

  function buildSnippet(url) {
    return `(function() {var walkme = document.createElement('script'); walkme.type = 'text/javascript'; walkme.async = true; walkme.src = '${url}'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(walkme, s); window._walkmeConfig = {smartLoad:true}; })();`;
  }

  function injectSnippet(url) {
    const walkme = document.createElement('script');
    walkme.type = 'text/javascript';
    walkme.async = true;
    walkme.src = url;
    const s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(walkme, s);
    window._walkmeConfig = { smartLoad: true };
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.top = '20px';
  host.style.left = '20px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: Menlo, Consolas, monospace; }
    .panel {
      width: 420px; max-height: 85vh; overflow-y: auto;
      background: #1e1e1e; color: #eee; font-size: 12px; line-height: 1.4;
      border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.5);
    }
    .header {
      background: #111; padding: 8px 10px; border-bottom: 1px solid #444;
      display: flex; justify-content: space-between; align-items: center; cursor: move;
    }
    .header strong { color: #fff; }
    .body { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    label { display: block; color: #aaa; margin-bottom: 3px; }
    select, input[type="text"] {
      width: 100%; background: #2a2a2a; color: #eee; border: 1px solid #555;
      border-radius: 4px; padding: 5px 6px; font-size: 12px;
    }
    button {
      all: unset; background: #333; color: #eee; border: 1px solid #555;
      border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 11px;
      display: inline-block; text-align: center;
    }
    button:hover { background: #444; }
    button.icon-btn { padding: 3px 8px; font-weight: 700; }
    button.primary { background: #2e7d32; border-color: #388e3c; }
    button.primary:hover { background: #388e3c; }
    button.gitlab-btn { background: #6e49cb; border-color: #7b52e0; }
    button.gitlab-btn:hover { background: #7b52e0; }
    .row { display: flex; gap: 6px; }
    .preview {
      background: #111; border: 1px solid #333; border-radius: 4px; padding: 6px;
      word-break: break-all; color: #9cdcfe; max-height: 90px; overflow-y: auto;
    }
    .msg { color: #6ab04c; min-height: 14px; }
    .hidden { display: none; }
  `;
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="header" id="wi-header">
      <strong>WalkMe Injector</strong>
      <button id="wi-close" class="icon-btn">✕</button>
    </div>
    <div class="body">
      <div>
        <label>Environment</label>
        <select id="wi-env">
          <option value="cdn.walkme.com">Prod US (cdn.walkme.com)</option>
          <option value="cdn.walkmeqa.com">QA (cdn.walkmeqa.com)</option>
        </select>
      </div>
      <div>
        <label>User GUID</label>
        <input type="text" id="wi-guid" placeholder="e.g. 7cdf0e5eb1974f5b986ab39ee34c52cf">
      </div>
      <div>
        <label>Path</label>
        <select id="wi-segment">
          <option value="">Production</option>
          <option value="test" selected>Test</option>
          <option value="success">Success</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div id="wi-custom-wrap" class="hidden">
        <label>Custom path segment</label>
        <input type="text" id="wi-custom" placeholder="e.g. staging">
      </div>
      <div>
        <label>Preview</label>
        <div class="preview" id="wi-preview">—</div>
      </div>
      <div class="row">
        <button id="wi-inject" class="primary">Inject now</button>
        <button id="wi-copy">Copy script</button>
      </div>
      <div class="row">
        <button id="wi-grab" class="gitlab-btn">Grab libs</button>
      </div>
      <div class="msg" id="wi-msg"></div>
    </div>
  `;
  shadow.appendChild(panel);

  const envEl = panel.querySelector('#wi-env');
  const guidEl = panel.querySelector('#wi-guid');
  const segmentEl = panel.querySelector('#wi-segment');
  const customWrapEl = panel.querySelector('#wi-custom-wrap');
  const customEl = panel.querySelector('#wi-custom');
  const previewEl = panel.querySelector('#wi-preview');
  const msgEl = panel.querySelector('#wi-msg');
  const grabBtn = panel.querySelector('#wi-grab');

  function currentSegment() {
    if (segmentEl.value === 'custom') return customEl.value.trim();
    return segmentEl.value;
  }

  function currentUrl() {
    const guid = guidEl.value.trim();
    if (!guid) return null;
    return buildUrl(envEl.value, guid, currentSegment());
  }

  function updatePreview() {
    const url = currentUrl();
    if (!url) {
      previewEl.textContent = 'Enter a GUID to preview the script.';
      return;
    }
    previewEl.textContent = buildSnippet(url);
  }

  function updateSegmentVisibility() {
    customWrapEl.classList.toggle('hidden', segmentEl.value !== 'custom');
  }

  envEl.onchange = updatePreview;
  guidEl.oninput = updatePreview;
  segmentEl.onchange = () => { updateSegmentVisibility(); updatePreview(); };
  customEl.oninput = updatePreview;

  updateSegmentVisibility();
  updatePreview();

  panel.querySelector('#wi-close').onclick = () => host.remove();

  panel.querySelector('#wi-inject').onclick = () => {
    const url = currentUrl();
    if (!url) { msgEl.textContent = 'Enter a GUID first.'; msgEl.style.color = '#e05252'; return; }
    injectSnippet(url);
    msgEl.style.color = '#6ab04c';
    msgEl.textContent = 'Injected — script tag added to the page.';
  };

  panel.querySelector('#wi-copy').onclick = async () => {
    const url = currentUrl();
    if (!url) {
