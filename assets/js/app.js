// ─── ByteSeal App ─────────────────────────────────────────────────────────────
// Main SPA controller. Handles view switching, form binding, URL sync.

import { analyze, METER_HTML } from '/assets/js/password/entropy.js';
import { generatePassword }    from '/assets/js/password/generator.js';

const SVG_EYE     = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const SVG_EYE_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const SVG_UPLOAD  = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
const SVG_DICE    = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

function dropZone(accept) {
  return `
    <div class="drop-zone" id="dropZone">
      <input type="file" id="file" class="drop-input" ${accept ? `accept="${accept}"` : ''}>
      <div class="drop-icon">${SVG_UPLOAD}</div>
      <p class="drop-text">Drop file here or <label for="file" class="drop-browse">browse</label></p>
      <p class="drop-hint" id="fileName">${accept ? 'Accepts .byts containers only' : 'Any file type accepted'}</p>
    </div>`;
}

function passwordField(placeholder, showGenerate = false) {
  return `
    <div class="pw-wrap">
      <input class="input" type="password" id="password" placeholder="${placeholder}" required>
      ${showGenerate ? `<button type="button" class="pw-generate" id="pwGenerate" aria-label="Generate password">${SVG_DICE}</button>` : ''}
      <button type="button" class="pw-toggle" id="pwToggle" aria-label="Show password">${SVG_EYE}</button>
    </div>`;
}

const LOCK_FORM = `
  <form class="system" id="form">
    ${dropZone('')}
    ${passwordField('Set an Encryption password', true)}
    ${METER_HTML}
    <button class="button-confirm" id="lockBtn" type="submit">Encrypt &amp; Download →</button>
    <div id="status"></div>
  </form>`;

const UNLOCK_FORM = `
  <form class="system" id="form">
    ${dropZone('.byts')}
    ${passwordField('Enter Decryption password', false)}
    <button class="button-confirm" id="unlockBtn" type="submit">Decrypt &amp; Download →</button>
    <div id="status"></div>
  </form>`;

const viewEl     = document.getElementById('view');
const modeSelect = document.getElementById('modeSelect');
let   currentMode = null;
function swapView(html) {
  viewEl.classList.remove('view-in');
  void viewEl.offsetWidth;
  viewEl.innerHTML = html;
  viewEl.classList.add('view-in');
  bindToggle();
  bindGenerator();
  bindDropZone();
  bindEntropy();
}

function bindToggle() {
  const toggle = document.getElementById('pwToggle');
  const input  = document.getElementById('password');
  if (!toggle || !input) return;

  toggle.addEventListener('click', () => {
    const show   = input.type === 'password';
    input.type   = show ? 'text' : 'password';
    toggle.innerHTML = show ? SVG_EYE_OFF : SVG_EYE;
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
}
function bindGenerator() {
  const btn   = document.getElementById('pwGenerate');
  const input = document.getElementById('password');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    btn.classList.add('spinning');

    const pw     = generatePassword(24);
    input.type   = 'text';
    input.value  = pw;

    const eyeBtn = document.getElementById('pwToggle');
    if (eyeBtn) {
      eyeBtn.innerHTML = SVG_EYE_OFF;
      eyeBtn.setAttribute('aria-label', 'Hide password');
    }
    input.dispatchEvent(new Event('input'));

    setTimeout(() => btn.classList.remove('spinning'), 420);
  });
}
function bindDropZone() {
  const zone   = document.getElementById('dropZone');
  const input  = document.getElementById('file');
  const nameEl = document.getElementById('fileName');
  if (!zone || !input) return;

  function setFile(file) {
    if (!file) return;
    nameEl.textContent = file.name;
    nameEl.classList.add('has-file');
    zone.classList.add('has-file');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
  }

  zone.addEventListener('click', e => {
    if (e.target === zone || e.target.closest('.drop-icon')) input.click();
  });

  input.addEventListener('change', () => {
    if (input.files[0]) setFile(input.files[0]);
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });
}

function bindEntropy() {
  const input   = document.getElementById('password');
  const wrap    = document.getElementById('entropyWrap');
  const bar     = document.getElementById('entropyBar');
  const labelEl = document.getElementById('entropyLabel');
  const bitsEl  = document.getElementById('entropyBits');
  const tipEl   = document.getElementById('entropyTip');

  if (!input || !wrap) return;
  wrap.classList.add('visible');

  function setButtonBlocked(blocked) {
    const btn = document.getElementById('lockBtn');
    if (!btn) return;
    btn.disabled = blocked;
    btn.classList.toggle('btn-blocked', blocked);
  }
  function update() {
    const pw = input.value;

    if (!pw.length) {
      bar.querySelectorAll('.entropy-seg').forEach(seg => seg.className = 'entropy-seg');
      labelEl.textContent = '—';
      bitsEl.textContent  = '';
      tipEl.textContent   = '';
      setButtonBlocked(true);
      return;
    }
    if (pw.length < 12) {
      bar.querySelectorAll('.entropy-seg').forEach(seg => seg.className = 'entropy-seg');
      labelEl.textContent = 'Too Short';
      bitsEl.textContent  = `${pw.length} / 12 chars`;
      tipEl.textContent   = '↑ Minimum 12 characters required';
      setButtonBlocked(true);
      return;
    }

    const { score, segs, label, bits, tip } = analyze(pw);

    bar.querySelectorAll('.entropy-seg').forEach((seg, i) => {
      seg.className = 'entropy-seg';
      if (i + 1 <= segs) seg.classList.add(`lit-${segs}`);
    });

    labelEl.textContent = label;
    bitsEl.textContent  = `${bits} bits`;
    tipEl.textContent   = tip;

    setButtonBlocked(score < 2);
  }
  setButtonBlocked(true);
  input.addEventListener('input', update);
}

function loadMode(mode) {
  if (mode === currentMode && document.getElementById('form')) return;
  currentMode = mode;
  const isLock = mode === 'lock';

  document.title = isLock ? 'Encrypt - ByteSeal' : 'Decrypt - ByteSeal';

  modeSelect.querySelectorAll('.mode-option').forEach(btn => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });

  swapView(isLock ? LOCK_FORM : UNLOCK_FORM);

  const old = document.getElementById('_modeScript');
  if (old) old.remove();
  const script  = document.createElement('script');
  script.id     = '_modeScript';
  script.type   = 'module';
  script.src    = (isLock
    ? '/assets/js/func/lock.js'
    : '/assets/js/func/unlock.js') + '?t=' + Date.now();
  document.body.appendChild(script);
}


function modeFromURL() {
  const hash  = location.hash.replace('#', '').toLowerCase();
  const param = new URLSearchParams(location.search).get('mode')?.toLowerCase();
  const val   = hash || param;
  if (val === 'encrypt' || val === 'lock')   return 'lock';
  if (val === 'decrypt' || val === 'unlock') return 'unlock';
  return 'lock';
}

function pushURL(mode) {
  history.replaceState(null, '', '#' + (mode === 'lock' ? 'encrypt' : 'decrypt'));
}
modeSelect.querySelectorAll('.mode-option').forEach(btn => {
  btn.addEventListener('click', () => {
    loadMode(btn.dataset.mode);
    pushURL(btn.dataset.mode);
  });
});

document.getElementById('homeLink').addEventListener('click', e => {
  e.preventDefault();
  currentMode = null;
  loadMode('lock');
  pushURL('lock');
});

const initialMode = modeFromURL();
loadMode(initialMode);
pushURL(initialMode);