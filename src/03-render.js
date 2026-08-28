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
