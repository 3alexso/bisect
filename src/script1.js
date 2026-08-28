(async () => {
  const projectPath = 'walkme/engine/player/player';
  const project = encodeURIComponent(projectPath);
  const perPage = 100;

  // Fetch commits on develop
  const commitPages = 20; // 20 x 100 = 2000
  let commits = [];
  for (let page = 1; page <= commitPages; page++) {
    const res = await fetch(
      `https://gitlab.walkmernd.com/api/v4/projects/${project}/repository/commits?ref_name=develop&per_page=${perPage}&page=${page}`,
      { credentials: 'include' }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    commits = commits.concat(batch);
  }

  // Fetch pipelines on develop with status=success, collect passed commit SHAs
  const passedShas = new Set();
  for (let page = 1; page <= 100; page++) {
    const res = await fetch(
      `https://gitlab.walkmernd.com/api/v4/projects/${project}/pipelines?ref=develop&status=success&per_page=${perPage}&page=${page}`,
      { credentials: 'include' }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    batch.forEach(p => passedShas.add(p.sha));
  }

  // Keep only commits that have at least one passed pipeline
  const passedCommits = commits.filter(c => passedShas.has(c.id));

  const pad = (n) => String(n).padStart(2, '0');
  const versions = passedCommits.map(c => {
    const d = new Date(c.committed_date);
    const Y = d.getUTCFullYear();
    const Mo = pad(d.getUTCMonth() + 1);
    const D = pad(d.getUTCDate());
    const H = pad(d.getUTCHours());
    const Mi = pad(d.getUTCMinutes());
    const S = pad(d.getUTCSeconds());
    return `${Y}${Mo}${D}-${H}${Mi}${S}-${c.short_id}-dev2`;
  });

  const payload = JSON.stringify(versions);
  window.libVersions = versions;

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lib-versions.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log(`⬇️ Downloaded lib-versions.json with ${versions.length} passed-pipeline entries (out of ${commits.length} commits scanned).`);

  try { await navigator.clipboard.writeText(payload); console.log('Also copied to clipboard.'); }
  catch (e) { console.warn('Clipboard copy skipped:', e.name); }
})();
