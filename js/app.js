/**
 * app.js - Contrôleur de l'application HTML in URL
 * 100% exécuté dans le navigateur, idéal pour GitHub Pages.
 */

import { encodePayload, decodePayload, calculateUrlStats } from './compress.js';
import { renderToIframe, buildStandaloneExport } from './sandbox.js';

// Modèle de départ simple et flat
const DEFAULT_CODE = {
  html: `<div style="max-width: 480px; margin: 1.5rem auto; font-family: 'Nunito', sans-serif;">
  <h2 style="margin-top: 0; color: #9000d5;">HTML in URL</h2>
  <p>Tout ce que vous écrivez est stocké dans l'URL pour un partage direct sans serveur.</p>
  <button id="btn-compteur">Cliquez-moi : <span id="compteur">0</span></button>
</div>`,

  css: `button {
  background-color: #9000d5;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background-color: #7b00b7;
}`,

  js: `let count = 0;
const btn = document.getElementById('btn-compteur');
const val = document.getElementById('compteur');

btn.addEventListener('click', () => {
  count++;
  val.textContent = count;
  console.log('Bouton cliqué : ' + count);
});`
};

const state = {
  html: '',
  css: '',
  js: '',
  activeTab: 'html',
  consoleCount: 0,
  mobileView: 'editor', // 'editor' ou 'preview'
  qrInstance: null
};

// DOM Elements
const DOM = {
  workspace: document.getElementById('workspace'),
  editorPane: document.getElementById('editor-pane'),
  previewPane: document.getElementById('preview-pane'),
  resizer: document.getElementById('resizer'),
  previewFrame: document.getElementById('preview-frame'),

  // Header & URL
  urlDisplay: document.getElementById('url-display-input'),
  charCounter: document.getElementById('char-counter'),
  btnCopyUrl: document.getElementById('btn-copy-url'),
  btnOpenQr: document.getElementById('btn-open-qr'),
  btnDownloadHtml: document.getElementById('btn-download-html'),
  btnToggleEditor: document.getElementById('btn-toggle-editor'),
  btnToggleLabel: document.getElementById('btn-toggle-label'),
  brandLogo: document.getElementById('brand-logo'),

  // Onglets Éditeur
  tabs: {
    html: document.getElementById('tab-html'),
    css: document.getElementById('tab-css'),
    js: document.getElementById('tab-js'),
    console: document.getElementById('tab-console')
  },
  wrappers: {
    html: document.getElementById('wrapper-html'),
    css: document.getElementById('wrapper-css'),
    js: document.getElementById('wrapper-js'),
    console: document.getElementById('wrapper-console')
  },
  textareas: {
    html: document.getElementById('textarea-html'),
    css: document.getElementById('textarea-css'),
    js: document.getElementById('textarea-js')
  },
  lines: {
    html: document.getElementById('lines-html'),
    css: document.getElementById('lines-css'),
    js: document.getElementById('lines-js')
  },

  // Console dans l'éditeur
  consoleLogsList: document.getElementById('console-logs-list'),
  consoleCount: document.getElementById('console-count'),
  btnClearConsole: document.getElementById('btn-clear-console'),

  // Modale QR
  modalQr: document.getElementById('modal-qr'),
  qrTarget: document.getElementById('qr-target'),
  btnCopyQrLink: document.getElementById('btn-copy-qr-link'),
  btnDownloadQrImg: document.getElementById('btn-download-qr-img'),

  // Toast
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toast-text')
};

// Afficher une notification toast
let toastTimer = null;
function showToast(text) {
  DOM.toastText.textContent = text;
  DOM.toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 2000);
}

// Numérotation des lignes
function updateLineNumbers(type) {
  if (!DOM.textareas[type]) return;
  const textarea = DOM.textareas[type];
  const count = (textarea.value.match(/\n/g) || []).length + 1;
  const arr = [];
  for (let i = 1; i <= count; i++) arr.push(i);
  DOM.lines[type].textContent = arr.join('\n');
}

// Gestion des touches dans l'éditeur (Tab = 2 espaces)
function handleKey(e, type) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta = DOM.textareas[type];
    const s = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + '  ' + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = s + 2;
    state[type] = ta.value;
    updateLineNumbers(type);
    triggerAutoSync();
  }
}

['html', 'css', 'js'].forEach(type => {
  const ta = DOM.textareas[type];
  ta.addEventListener('input', () => {
    state[type] = ta.value;
    updateLineNumbers(type);
    triggerAutoSync();
  });
  ta.addEventListener('scroll', () => {
    DOM.lines[type].scrollTop = ta.scrollTop;
  });
  ta.addEventListener('keydown', (e) => handleKey(e, type));
});

// Gestion des onglets
function switchTab(name) {
  state.activeTab = name;
  Object.keys(DOM.tabs).forEach(t => {
    const isActive = t === name;
    DOM.tabs[t].classList.toggle('active', isActive);
    DOM.wrappers[t].classList.toggle('active', isActive);
  });
  if (name !== 'console') {
    updateLineNumbers(name);
  }
}

Object.keys(DOM.tabs).forEach(t => {
  DOM.tabs[t].addEventListener('click', () => switchTab(t));
});

// Synchronisation automatique (déclenchée à chaque modification)
let syncDebounce = null;
function triggerAutoSync() {
  if (syncDebounce) clearTimeout(syncDebounce);
  syncDebounce = setTimeout(() => {
    syncUrl();
    renderPreview();
  }, 150);
}

// Encodage et mise à jour de l'URL
async function syncUrl() {
  const { compressed, rawLength, compressedLength } = await encodePayload({
    html: state.html,
    css: state.css,
    js: state.js
  });

  const hash = compressed ? `#c=${compressed}` : '';
  const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;

  window.history.replaceState(null, '', hash || window.location.pathname);
  DOM.urlDisplay.value = fullUrl;

  const urlLen = fullUrl.length;
  DOM.charCounter.textContent = `${urlLen} / 2048 car.`;

  DOM.charCounter.className = 'char-count';
  if (urlLen > 2048) {
    DOM.charCounter.classList.add('danger');
  } else if (urlLen > 1500) {
    DOM.charCounter.classList.add('warning');
  }

  // Règle QR Code : seulement si < 1024 caractères
  if (urlLen >= 1024) {
    DOM.btnOpenQr.disabled = true;
    DOM.btnOpenQr.title = `QR Code indisponible (${urlLen} car. ≥ 1024 max)`;
  } else {
    DOM.btnOpenQr.disabled = false;
    DOM.btnOpenQr.title = `Générer un QR Code (${urlLen} car. < 1024)`;
  }
}

// Mise à jour de l'iframe
function renderPreview() {
  renderToIframe(DOM.previewFrame, {
    html: state.html,
    css: state.css,
    js: state.js
  });
}

// Chargement depuis le hash URL
async function loadFromUrl() {
  const hash = window.location.hash.replace(/^#/, '');
  let compressed = '';

  if (hash.startsWith('c=')) {
    compressed = hash.substring(2);
  } else if (hash.includes('c=')) {
    const params = new URLSearchParams(hash);
    compressed = params.get('c') || '';
  } else if (hash) {
    compressed = hash;
  }

  if (compressed) {
    try {
      const decoded = await decodePayload(compressed);
      state.html = decoded.html || '';
      state.css = decoded.css || '';
      state.js = decoded.js || '';
    } catch {
      state.html = DEFAULT_CODE.html;
      state.css = DEFAULT_CODE.css;
      state.js = DEFAULT_CODE.js;
    }
  } else {
    state.html = DEFAULT_CODE.html;
    state.css = DEFAULT_CODE.css;
    state.js = DEFAULT_CODE.js;
  }

  DOM.textareas.html.value = state.html;
  DOM.textareas.css.value = state.css;
  DOM.textareas.js.value = state.js;

  ['html', 'css', 'js'].forEach(updateLineNumbers);
  renderPreview();
  syncUrl();
}

// Écoute de la console relayée
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'sandbox-console') return;
  const { level, text, time } = e.data;

  state.consoleCount++;
  DOM.consoleCount.textContent = state.consoleCount;

  // Retirer le message vide au premier log
  const emptyMsg = DOM.consoleLogsList.querySelector('.console-empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const row = document.createElement('div');
  row.className = `console-entry ${level || 'log'}`;
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'console-entry-time';
  timeSpan.textContent = time;

  const textSpan = document.createElement('span');
  textSpan.textContent = text;

  row.appendChild(timeSpan);
  row.appendChild(textSpan);
  DOM.consoleLogsList.appendChild(row);
  DOM.consoleLogsList.scrollTop = DOM.consoleLogsList.scrollHeight;
});

// Vider la console
DOM.btnClearConsole.addEventListener('click', () => {
  DOM.consoleLogsList.innerHTML = '<div class="console-empty-msg">Aucun message pour le moment.</div>';
  state.consoleCount = 0;
  DOM.consoleCount.textContent = '0';
});

// Copier l'URL
DOM.btnCopyUrl.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(DOM.urlDisplay.value);
    showToast('Lien copié !');
  } catch {
    DOM.urlDisplay.select();
    document.execCommand('copy');
    showToast('Lien copié !');
  }
});

// Télécharger en un seul fichier HTML
DOM.btnDownloadHtml.addEventListener('click', () => {
  const content = buildStandaloneExport({
    html: state.html,
    css: state.css,
    js: state.js,
    title: 'Mon Projet'
  });

  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projet.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Fichier HTML téléchargé !');
});

// QR Code (Strictement limité à < 1024 caractères)
DOM.btnOpenQr.addEventListener('click', () => {
  const currentUrl = DOM.urlDisplay.value || window.location.href;
  if (currentUrl.length >= 1024) {
    showToast('Le QR Code nécessite moins de 1024 caractères.');
    return;
  }

  DOM.modalQr.classList.add('open');
  DOM.qrTarget.innerHTML = '';

  if (window.QRCode) {
    state.qrInstance = new window.QRCode(DOM.qrTarget, {
      text: currentUrl,
      width: 200,
      height: 200,
      colorDark: '#181a20',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }
});

DOM.btnCopyQrLink.addEventListener('click', () => {
  navigator.clipboard.writeText(DOM.urlDisplay.value);
  showToast('Lien copié !');
});

DOM.btnDownloadQrImg.addEventListener('click', () => {
  const img = DOM.qrTarget.querySelector('img') || DOM.qrTarget.querySelector('canvas');
  if (!img) return;
  const src = img.tagName.toLowerCase() === 'canvas' ? img.toDataURL('image/png') : img.src;
  const a = document.createElement('a');
  a.href = src;
  a.download = 'qrcode.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Image QR téléchargée !');
});

// Fermeture de la modale
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-close');
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
  });
});

DOM.modalQr.addEventListener('click', (e) => {
  if (e.target === DOM.modalQr) DOM.modalQr.classList.remove('open');
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') DOM.modalQr.classList.remove('open');
});

// Bascule d'affichage Éditeur / Aperçu (PC & Mobile)
state.currentView = window.innerWidth <= 768 ? 'editor' : 'split';
DOM.workspace.classList.add(`view-${state.currentView}`);

function setViewMode(mode) {
  state.currentView = mode; // 'split', 'preview', 'editor'
  DOM.workspace.classList.remove('view-preview', 'view-editor', 'view-split');
  DOM.workspace.classList.add(`view-${mode}`);

  if (mode === 'preview') {
    DOM.btnToggleLabel.textContent = 'Éditeur';
    DOM.btnToggleEditor.title = 'Revenir à l\'éditeur';
  } else {
    DOM.btnToggleLabel.textContent = 'Aperçu';
    DOM.btnToggleEditor.title = 'Afficher l\'aperçu en plein écran';
  }
}

DOM.btnToggleEditor.addEventListener('click', () => {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    // Mobile : bascule entre éditeur plein écran et aperçu plein écran
    if (state.currentView === 'preview') {
      setViewMode('editor');
    } else {
      setViewMode('preview');
    }
  } else {
    // PC : bascule entre split (éditeur + aperçu) et aperçu plein écran
    if (state.currentView === 'preview') {
      setViewMode('split');
    } else {
      setViewMode('preview');
    }
  }
});

// Redimensionnement fluide de l'éditeur sur Desktop
let isDragging = false;

function startResizing(e) {
  if (DOM.workspace.classList.contains('view-preview') || DOM.workspace.classList.contains('view-editor')) {
    return;
  }
  isDragging = true;
  DOM.resizer.classList.add('dragging');
  // Désactive les événements de l'iframe pour permettre le glissement vers la droite sans interruption
  DOM.previewFrame.style.pointerEvents = 'none';
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function onResizing(e) {
  if (!isDragging) return;
  const rect = DOM.workspace.getBoundingClientRect();
  const widthPercent = ((e.clientX - rect.left) / rect.width) * 100;
  if (widthPercent >= 10 && widthPercent <= 90) {
    DOM.editorPane.style.width = `${widthPercent}%`;
  }
}

function stopResizing() {
  if (isDragging) {
    isDragging = false;
    DOM.resizer.classList.remove('dragging');
    DOM.previewFrame.style.pointerEvents = 'auto'; // Réactive l'iframe
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
}

DOM.resizer.addEventListener('mousedown', startResizing);
window.addEventListener('mousemove', onResizing);
window.addEventListener('mouseup', stopResizing);
window.addEventListener('blur', stopResizing);

DOM.brandLogo.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.hash = '';
  loadFromUrl();
});

window.addEventListener('hashchange', loadFromUrl);

// Lancement
loadFromUrl();
