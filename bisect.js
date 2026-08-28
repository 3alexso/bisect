(() => {
  function main() {
    const HOST_ID = 'wm-lib-version-host';
    document.getElementById(HOST_ID)?.remove();
    document.getElementById('wm-lib-version-panel')?.remove();

    const LIST_KEY = 'wm_libVersionList_v1';
    const STATUS_KEY = 'wm_libVersionStatus_v1';
    const GITLAB_PROJECT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/';
    const GITLAB_COMMIT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/-/commit/';
    const WALKME_INJECTOR_SOURCE = "(() => {\n  const HOST_ID = 'wm-injector-host';\n  document.getElementById(HOST_ID)?.remove();\n\n  const QA_DEPLOY_HISTORY_URL = 'https://eux-prod.walkmernd.com/playerDeployment/deployHistory';\n  const GITLAB_PROJECT_URL = 'https://gitlab.walkmernd.com/walkme/engine/player/player/';\n\n  const SCRIPT1_SOURCE = [\n    \"(async () => {\",\n    \"  const projectPath = 'walkme/engine/player/player';\",\n    \"  const project = encodeURIComponent(projectPath);\",\n    \"  const perPage = 100;\",\n    \"\",\n    \"  // Fetch commits on develop\",\n    \"  const commitPages = 20; // 20 x 100 = 2000\",\n    \"  let commits = [];\",\n    \"  for (let page = 1; page <= commitPages; page++) {\",\n    \"    const res = await fetch(\",\n    \"      `https://gitlab.walkmernd.com/api/v4/projects/${project}/repository/commits?ref_name=develop&per_page=${perPage}&page=${page}`,\",\n    \"      { credentials: 'include' }\",\n    \"    );\",\n    \"    const batch = await res.json();\",\n    \"    if (!Array.isArray(batch) || batch.length === 0) break;\",\n    \"    commits = commits.concat(batch);\",\n    \"  }\",\n    \"\",\n    \"  // Fetch pipelines on develop with status=success, collect passed commit SHAs\",\n    \"  const passedShas = new Set();\",\n    \"  for (let page = 1; page <= 100; page++) {\",\n    \"    const res = await fetch(\",\n    \"      `https://gitlab.walkmernd.com/api/v4/projects/${project}/pipelines?ref=develop&status=success&per_page=${perPage}&page=${page}`,\",\n    \"      { credentials: 'include' }\",\n    \"    );\",\n    \"    const batch = await res.json();\",\n    \"    if (!Array.isArray(batch) || batch.length === 0) break;\",\n    \"    batch.forEach(p => passedShas.add(p.sha));\",\n    \"  }\",\n    \"\",\n    \"  // Keep only commits that have at least one passed pipeline\",\n    \"  const passedCommits = commits.filter(c => passedShas.has(c.id));\",\n    \"\",\n    \"  const pad = (n) => String(n).padStart(2, '0');\",\n    \"  const versions = passedCommits.map(c => {\",\n    \"    const d = new Date(c.committed_date);\",\n    \"    const Y = d.getUTCFullYear();\",\n    \"    const Mo = pad(d.getUTCMonth() + 1);\",\n    \"    const D = pad(d.getUTCDate());\",\n    \"    const H = pad(d.getUTCHours());\",\n    \"    const Mi = pad(d.getUTCMinutes());\",\n    \"    const S = pad(d.getUTCSeconds());\",\n    \"    return `${Y}${Mo}${D}-${H}${Mi}${S}-${c.short_id}-dev2`;\",\n    \"  });\",\n    \"\",\n    \"  const payload = JSON.stringify(versions);\",\n    \"  window.libVersions = versions;\",\n    \"\",\n    \"  const blob = new Blob([payload], { type: 'application/json' });\",\n    \"  const url = URL.createObjectURL(blob);\",\n    \"  const a = document.createElement('a');\",\n    \"  a.href = url;\",\n    \"  a.download = 'lib-versions.json';\",\n    \"  document.body.appendChild(a);\",\n    \"  a.click();\",\n    \"  document.body.removeChild(a);\",\n    \"  URL.revokeObjectURL(url);\",\n    \"  console.log(`\u2b07\ufe0f Downloaded lib-versions.json with ${versions.length} passed-pipeline entries (out of ${commits.length} commits scanned).`);\",\n    \"\",\n    \"  try { await navigator.clipboard.writeText(payload); console.log('Also copied to clipboard.'); }\",\n    \"  catch (e) { console.warn('Clipboard copy skipped:', e.name); }\",\n    \"})();\",\n  ].join('\\n');\n\n  const SCRIPT2_QA_SOURCE = [\n    \"(function() {\",\n    \"  const versionRe = /^\\\\d{8}-\\\\d{6}-[0-9a-f]+$/i;\",\n    \"  const rows = Array.from(document.querySelectorAll('table tr'));\",\n    \"  const seen = new Set();\",\n    \"  const versions = [];\",\n    \"\",\n    \"  rows.forEach(row => {\",\n    \"    const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim());\",\n    \"    if (!cells.length) return;\",\n    \"    const version = cells[0];\",\n    \"    const branch = (cells[1] || '').toLowerCase();\",\n    \"    if (versionRe.test(version) && (!branch || branch === 'qa') && !seen.has(version)) {\",\n    \"      seen.add(version);\",\n    \"      versions.push(version);\",\n    \"    }\",\n    \"  });\",\n    \"\",\n    \"  const payload = JSON.stringify(versions);\",\n    \"  window.libVersionsQA = versions;\",\n    \"\",\n    \"  const blob = new Blob([payload], { type: 'application/json' });\",\n    \"  const url = URL.createObjectURL(blob);\",\n    \"  const a = document.createElement('a');\",\n    \"  a.href = url;\",\n    \"  a.download = 'lib-versions-qa.json';\",\n    \"  document.body.appendChild(a);\",\n    \"  a.click();\",\n    \"  document.body.removeChild(a);\",\n    \"  URL.revokeObjectURL(url);\",\n    \"  console.log(`\u2b07\ufe0f Downloaded lib-versions-qa.json with ${versions.length} entries (only rows currently rendered in the table are scanned).`);\",\n    \"\",\n    \"  navigator.clipboard.writeText(payload)\",\n    \"    .then(() => console.log('Also copied to clipboard.'))\",\n    \"    .catch(e => console.warn('Clipboard copy skipped:', e.name));\",\n    \"})();\",\n  ].join('\\n');\n\n  async function copyToClipboard(text) {\n    try { await navigator.clipboard.writeText(text); return true; } catch {}\n    try {\n      const ta = document.createElement('textarea');\n      ta.value = text;\n      ta.style.position = 'fixed'; ta.style.left = '-9999px';\n      document.body.appendChild(ta); ta.focus(); ta.select();\n      const ok = document.execCommand('copy');\n      document.body.removeChild(ta);\n      return ok;\n    } catch { return false; }\n  }\n\n  function buildUrl(domain, guid, segment) {\n    const seg = segment ? `${segment}/` : '';\n    return `https://${domain}/users/${guid}/${seg}walkme_${guid}_https.js`;\n  }\n\n  function buildSnippet(url) {\n    return `(function() {var walkme = document.createElement('script'); walkme.type = 'text/javascript'; walkme.async = true; walkme.src = '${url}'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(walkme, s); window._walkmeConfig = {smartLoad:true}; })();`;\n  }\n\n  function injectSnippet(url) {\n    const walkme = document.createElement('script');\n    walkme.type = 'text/javascript';\n    walkme.async = true;\n    walkme.src = url;\n    const s = document.getElementsByTagName('script')[0];\n    s.parentNode.insertBefore(walkme, s);\n    window._walkmeConfig = { smartLoad: true };\n  }\n\n  const host = document.createElement('div');\n  host.id = HOST_ID;\n  host.style.all = 'initial';\n  host.style.position = 'fixed';\n  host.style.top = '20px';\n  host.style.left = '20px';\n  host.style.zIndex = '2147483647';\n  document.body.appendChild(host);\n\n  const shadow = host.attachShadow({ mode: 'open' });\n\n  const style = document.createElement('style');\n  style.textContent = `\n    :host { all: initial; }\n    * { box-sizing: border-box; font-family: Menlo, Consolas, monospace; }\n    .panel {\n      width: 420px; max-height: 85vh; overflow-y: auto;\n      background: #1e1e1e; color: #eee; font-size: 12px; line-height: 1.4;\n      border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.5);\n    }\n    .header {\n      background: #111; padding: 8px 10px; border-bottom: 1px solid #444;\n      display: flex; justify-content: space-between; align-items: center; cursor: move;\n    }\n    .header strong { color: #fff; }\n    .body { padding: 10px; display: flex; flex-direction: column; gap: 8px; }\n    label { display: block; color: #aaa; margin-bottom: 3px; }\n    select, input[type=\"text\"] {\n      width: 100%; background: #2a2a2a; color: #eee; border: 1px solid #555;\n      border-radius: 4px; padding: 5px 6px; font-size: 12px;\n    }\n    button {\n      all: unset; background: #333; color: #eee; border: 1px solid #555;\n      border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 11px;\n      display: inline-block; text-align: center;\n    }\n    button:hover { background: #444; }\n    button.icon-btn { padding: 3px 8px; font-weight: 700; }\n    button.primary { background: #2e7d32; border-color: #388e3c; }\n    button.primary:hover { background: #388e3c; }\n    button.gitlab-btn { background: #6e49cb; border-color: #7b52e0; }\n    button.gitlab-btn:hover { background: #7b52e0; }\n    .row { display: flex; gap: 6px; }\n    .preview {\n      background: #111; border: 1px solid #333; border-radius: 4px; padding: 6px;\n      word-break: break-all; color: #9cdcfe; max-height: 90px; overflow-y: auto;\n    }\n    .msg { color: #6ab04c; min-height: 14px; }\n    .hidden { display: none; }\n  `;\n  shadow.appendChild(style);\n\n  const panel = document.createElement('div');\n  panel.className = 'panel';\n  panel.innerHTML = `\n    <div class=\"header\" id=\"wi-header\">\n      <strong>WalkMe Injector</strong>\n      <button id=\"wi-close\" class=\"icon-btn\">\u2715</button>\n    </div>\n    <div class=\"body\">\n      <div>\n        <label>Environment</label>\n        <select id=\"wi-env\">\n          <option value=\"cdn.walkme.com\">Prod US (cdn.walkme.com)</option>\n          <option value=\"cdn.walkmeqa.com\">QA (cdn.walkmeqa.com)</option>\n        </select>\n      </div>\n      <div>\n        <label>User GUID</label>\n        <input type=\"text\" id=\"wi-guid\" placeholder=\"e.g. 7cdf0e5eb1974f5b986ab39ee34c52cf\">\n      </div>\n      <div>\n        <label>Path</label>\n        <select id=\"wi-segment\">\n          <option value=\"\">Production</option>\n          <option value=\"test\" selected>Test</option>\n          <option value=\"success\">Success</option>\n          <option value=\"custom\">Custom</option>\n        </select>\n      </div>\n      <div id=\"wi-custom-wrap\" class=\"hidden\">\n        <label>Custom path segment</label>\n        <input type=\"text\" id=\"wi-custom\" placeholder=\"e.g. staging\">\n      </div>\n      <div>\n        <label>Preview</label>\n        <div class=\"preview\" id=\"wi-preview\">\u2014</div>\n      </div>\n      <div class=\"row\">\n        <button id=\"wi-inject\" class=\"primary\">Inject now</button>\n        <button id=\"wi-copy\">Copy script</button>\n      </div>\n      <div class=\"row\">\n        <button id=\"wi-grab\" class=\"gitlab-btn\">Grab libs</button>\n      </div>\n      <div class=\"msg\" id=\"wi-msg\"></div>\n    </div>\n  `;\n  shadow.appendChild(panel);\n\n  const envEl = panel.querySelector('#wi-env');\n  const guidEl = panel.querySelector('#wi-guid');\n  const segmentEl = panel.querySelector('#wi-segment');\n  const customWrapEl = panel.querySelector('#wi-custom-wrap');\n  const customEl = panel.querySelector('#wi-custom');\n  const previewEl = panel.querySelector('#wi-preview');\n  const msgEl = panel.querySelector('#wi-msg');\n  const grabBtn = panel.querySelector('#wi-grab');\n\n  function currentSegment() {\n    if (segmentEl.value === 'custom') return customEl.value.trim();\n    return segmentEl.value;\n  }\n\n  function currentUrl() {\n    const guid = guidEl.value.trim();\n    if (!guid) return null;\n    return buildUrl(envEl.value, guid, currentSegment());\n  }\n\n  function updatePreview() {\n    const url = currentUrl();\n    if (!url) {\n      previewEl.textContent = 'Enter a GUID to preview the script.';\n      return;\n    }\n    previewEl.textContent = buildSnippet(url);\n  }\n\n  function updateSegmentVisibility() {\n    customWrapEl.classList.toggle('hidden', segmentEl.value !== 'custom');\n  }\n\n  envEl.onchange = updatePreview;\n  guidEl.oninput = updatePreview;\n  segmentEl.onchange = () => { updateSegmentVisibility(); updatePreview(); };\n  customEl.oninput = updatePreview;\n\n  updateSegmentVisibility();\n  updatePreview();\n\n  panel.querySelector('#wi-close').onclick = () => host.remove();\n\n  panel.querySelector('#wi-inject').onclick = () => {\n    const url = currentUrl();\n    if (!url) { msgEl.textContent = 'Enter a GUID first.'; msgEl.style.color = '#e05252'; return; }\n    injectSnippet(url);\n    msgEl.style.color = '#6ab04c';\n    msgEl.textContent = 'Injected \u2014 script tag added to the page.';\n  };\n\n  panel.querySelector('#wi-copy').onclick = async () => {\n    const url = currentUrl();\n    if (!url) { msgEl.textContent = 'Enter a GUID first.'; msgEl.style.color = '#e05252'; return; }\n    const ok = await copyToClipboard(buildSnippet(url));\n    msgEl.style.color = ok ? '#6ab04c' : '#e05252';\n    msgEl.textContent = ok ? 'Copied to clipboard.' : 'Copy failed \u2014 check clipboard permissions.';\n  };\n\n  grabBtn.onclick = async () => {\n    if (envEl.value === 'cdn.walkme.com') {\n      window.open(GITLAB_PROJECT_URL, '_blank');\n      const ok = await copyToClipboard(SCRIPT1_SOURCE);\n      grabBtn.textContent = ok ? 'Copied \u2014 paste in GitLab console!' : 'Copy failed, try again';\n    } else {\n      window.open(QA_DEPLOY_HISTORY_URL, '_blank');\n      const ok = await copyToClipboard(SCRIPT2_QA_SOURCE);\n      grabBtn.textContent = ok ? 'Copied \u2014 paste in deploy history console!' : 'Copy failed, try again';\n    }\n    setTimeout(() => { grabBtn.textContent = 'Grab libs'; }, 3000);\n  };\n\n  let dragOffset = null;\n  const header = panel.querySelector('#wi-header');\n  header.onmousedown = (e) => {\n    if (e.target.closest('button')) return;\n    dragOffset = { x: e.clientX - host.offsetLeft, y: e.clientY - host.offsetTop };\n  };\n  document.addEventListener('mousemove', (e) => {\n    if (!dragOffset) return;\n    host.style.left = (e.clientX - dragOffset.x) + 'px';\n    host.style.top = (e.clientY - dragOffset.y) + 'px';\n  });\n  document.addEventListener('mouseup', () => { dragOffset = null; });\n})();\n";

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

    let versions = null;
    try { versions = JSON.parse(localStorage.getItem(LIST_KEY)); } catch {}

    const loadStatus = () => { try { return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; } catch { return {}; } };
    const saveStatus = (s) => localStorage.setItem(STATUS_KEY, JSON.stringify(s));
    let status = loadStatus();

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

    async function copyInjectorScript(btn) {
      const ok = await copyToClipboard(WALKME_INJECTOR_SOURCE);
      const original = 'Injector';
      btn.textContent = ok ? 'Copied — paste in this console!' : 'Copy failed, try again';
      setTimeout(() => { btn.textContent = original; }, 2500);
    }

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
    style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: Menlo, Consolas, monospace; }
      .panel {
        width: 480px; max-height: 85vh; min-width: 320px; min-height: 160px;
        display: flex; flex-direction: column; position: relative;
        background: #1e1e1e; color: #eee; font-size: 12px; line-height: 1.35;
        border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.5);
        overflow: hidden;
      }
      .panel.collapsed { height: auto !important; min-height: 0 !important; max-height: none !important; }
      .content { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
      .panel.collapsed .content .scroll-area,
      .panel.collapsed .content .intake,
      .panel.collapsed .content .header-actions { display: none; }
      .header { flex: 0 0 auto; background: #111; padding: 6px 10px; border-bottom: 1px solid #444; cursor: move; }
      .header-top { display: flex; flex-wrap: nowrap; justify-content: space-between; align-items: center; gap: 6px; }
      .header-top .title-group { display: flex; align-items: center; gap: 5px; min-width: 0; flex: 1 1 auto; overflow: hidden; }
      .header-top strong { color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .header-btns { display: flex; gap: 5px; flex: 0 0 auto; }
      .header-btns button { flex-shrink: 0; }
      .header-actions { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
      button {
        all: unset;
        background: #333; color: #eee; border: 1px solid #555;
        border-radius: 4px; padding: 3px 7px; cursor: pointer; font-size: 11px;
        display: inline-block; text-align: center;
      }
      button:hover { background: #444; }
      button.icon-btn { padding: 3px 8px; font-weight: 700; }
      button.gitlab-btn { background: #6e49cb; border-color: #7b52e0; }
      button.gitlab-btn:hover { background: #7b52e0; }
      button.apply-btn { background: #2e7d32; border-color: #388e3c; }
      button.apply-btn:hover { background: #388e3c; }
      button.reset-lib-btn { background: #8a5a00; border-color: #a56d00; }
      button.reset-lib-btn:hover { background: #a56d00; }
      .suggest {
        flex: 0 0 auto; padding: 6px 10px; background: #2a2a2a; border-bottom: 1px solid #444;
        color: #ddd; display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;
      }
      .suggest button { flex: 0 0 auto; background: #1565c0; border-color: #1976d2; }
      .suggest button:hover { background: #1976d2; }
      .suggest.broken { background: #4a1414; border-bottom-color: #b3261e; color: #ffb3b3; }
      .suggest.broken button { background: #b3261e; border-color: #d32f2f; }
      .suggest.broken button:hover { background: #d32f2f; }
      .suggest .btn-group { display: flex; gap: 5px; }
      .scroll-area { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
      table { width: 100%; border-collapse: separate; border-spacing: 0; }
      th {
        text-align: left; padding: 4px 8px; background: #2a2a2a; color: #ccc;
        position: sticky; top: 0; z-index: 1; border-bottom: 1px solid #444;
      }
      td { padding: 3px 8px; border-bottom: 1px solid #333; color: #eee; }
      .row-num-cell { text-align: left; white-space: nowrap; color: #888; width: 2.5em; }
      .version-cell { word-break: break-all; }
      .apply-cell, .status-cell { text-align: center; white-space: nowrap; }
      .status-cell button { margin-right: 3px; opacity: 0.6; }
      .status-cell button.active { opacity: 1; }
      tr.jump-highlight { background: #ffb30055 !important; transition: background 0.3s; }
      tr.broken-row { background: #b3261e !important; }
      tr.broken-row td { color: #fff; font-weight: 600; }
      tr.broken-row .row-num-cell { color: #ffd6d6; }
      p { color: inherit; margin: 0 0 8px; }
      .intake { padding: 12px; }
      .intake-msg { margin-top: 8px; color: #f66; }
      .resize-handle {
        position: absolute; left: 0; bottom: 0; width: 14px; height: 14px;
        cursor: nesw-resize;
        background: linear-gradient(45deg, transparent 0 40%, #777 40% 55%, transparent 55% 70%, #777 70% 85%, transparent 85% 100%);
      }
    `;
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
            <button id="wm-injector" class="gitlab-btn" title="Paste to devtools to open the WalkMe Injector panel">Injector</button>
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
      content.querySelector('#wm-injector').onclick = (e) => copyInjectorScript(e.target);

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
