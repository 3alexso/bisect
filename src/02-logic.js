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
