let allCommands = [];

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultsEl = document.getElementById('results');
const emptyEl = document.getElementById('empty');
const toastEl = document.getElementById('toast');

// ─── SVG Icon Strings ───
const ICONS = {
  terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  linux: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="18" x2="12" y2="21"></line></svg>`,
  termux: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"></rect><line x1="10" y1="18" x2="14" y2="18"></line></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
};

// Load commands
fetch('commands.json')
  .then(res => res.json())
  .then(data => {
    allCommands = data;
    render(allCommands);
  })
  .catch(err => {
    console.error('Failed to load commands:', err);
    resultsEl.innerHTML = '<p style="color:#f87171;text-align:center;padding:20px">Failed to load commands.json</p>';
  });

// Search
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  clearBtn.classList.toggle('hidden', !q);

  if (!q) {
    render(allCommands);
    return;
  }
  const filtered = allCommands.filter(cmd => {
    const haystack = [
      cmd.title,
      cmd.desc,
      cmd.cmd,
      ...(cmd.keywords || [])
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  });
  render(filtered);
});

// Clear button
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.classList.add('hidden');
  render(allCommands);
  searchInput.focus();
});

// Render cards
function render(list) {
  resultsEl.innerHTML = '';
  if (list.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  list.forEach((cmd, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${Math.min(i * 0.03, 0.3)}s`;

    const tagHtml = (cmd.tags || [])
      .map(t => `<span class="tag ${t}">${ICONS[t] || ''}${t}</span>`)
      .join(' ');

    card.innerHTML = `
      <div class="card-title">
        ${ICONS.terminal}
        <span>${escapeHtml(cmd.title)}</span>
        ${tagHtml}
      </div>
      <div class="card-desc">${escapeHtml(cmd.desc)}</div>
      <div class="cmd-box">
        <code>${escapeHtml(cmd.cmd)}</code>
        <button class="copy-btn" data-cmd="${escapeHtml(cmd.cmd)}">
          ${ICONS.copy}
          <span>Copy</span>
        </button>
      </div>
    `;
    resultsEl.appendChild(card);
  });

  // Attach copy handlers
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-cmd');
      copyToClipboard(text);
      showToast();

      // Visual feedback
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `${ICONS.check}<span>Copied</span>`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 1500);
    });
  });
}

// Copy
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// Toast
let toastTimer;
function showToast() {
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1500);
}

// XSS safety
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}