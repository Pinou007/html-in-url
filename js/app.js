/**
 * app.js - Contrôleur de l'application HTML in URL
 * 100% exécuté dans le navigateur, idéal pour GitHub Pages.
 */

import { encodePayload, decodePayload, calculateUrlStats } from './compress.js';
import { renderToIframe, buildStandaloneExport, PERMISSION_ITEMS } from './sandbox.js';

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

const MAX_CHARS = 6144;

// Hash de la page de sécurité pré-encodée dans le propre système de HTML in URL
const SECURITY_PAGE_HASH = '3VnbjuPGEf2VMhf2zAAkRVI3jlYjx94g8Aa-JBnHQWD5oUWWpPaS3dzuplYzCwN5DWAgQeKnXLBJnjLwDyTIm_Un-wPZTwi6eREpcXZnfXnJDCSQza7qupxTXU19ak1juoEoIVJezC2JkZORFc6t2ZwBTNdIYhStx8VQOQHgSHxB4lreTJCbFTyhsVpfzK1gMLdgjXS1VtXdhuKTd_n2Ym554EEwADO6pElyMbcYZzi3QCrBH-HF3Lp37nlePKyHnFrx3JpNM6LWEF_MrQ_8AIJAhs4AQsf3PhkmTuj0nRD6m3HkwQhC8D3zda3lelpwNu3JzaphdkbY7HJ3E-WCqt0NvAXv7W4WKFaYIlPTnnlexqAX0011vfZn7338wftAGfzyF-_D8998BQ-QKYEQI-z1TXtrvxLJWgGU-UJRlegYPmRLLlKiKGcSlCBMZkQgUyhB5gIShCVnkX7MjFUgCZMgUWwwF3q9CEFShfAEF-60lxVJ7RUpnM2ZuU0JZS0DVoLG-_y-4TjwbsIj8GHSCgH4nvcmxHrF5ES76jiVjERjVEtrRETchEUTN_qZQyPOnMrzatrBRDNnkS8WCUKWi-xg7iHaghbagu8XbREVUYIQaWW-1h1dVVdCX3gGWsWs2TShDGHrF8Jw5VdTt0Fl2lVQjs2mPT37EM_EH7p9MF_adh8GGsQHg073oHM8CHrwVvi3QV0AO5i9ePbl7-Gj3b8BpYJ1gYXdTY2yt6e9dbDPcEvBNJs92IOxgVuY6uCy1czAqQngaa98Am_AxzxXGu8RjxFONcFseHB5acNPL8-MNVLx6NHuBlBBxNNMoJS7G4ipwEgVcN0j1YV38ihnsKTRmqKwQUaCZgp4DgsiDVFjztjuBiWwE6094kwbtbsxvGNcQkqiNWUoa1pph0vcl8xqkieASbForbqyGLXJNM24lHRBE1NrYgSZZ5mgKYo70Eq7tkLx_VNMYPyD8guXg8Fg8D3zy68JFlb88rv51SXjj_ZCrufXcqOG3KuZUkdT4VY5RRif_-lv__3X7w5RUOCrxkIFr5ICEiZ34xQ7wS2VqlBADLqrbYDRI1S78DAxrMkZfZwX9Ig4U8jykiYICUUGj3OEhECGQhqubngugQCyDb_a3TSwfwCiEpALvm0DrST0wzTjQhGmtHsVyUuTYs4iUBit96ZV7EiME9983SDHN__RrP3ma1gQxqi5r6pRjFlOJewjYYMeeJyf0ATYyRWQMlBlGdgXNPcw3J0-knhDI3QWCY8etb1c92cvnv357zrbP8-1IRu8dkzoloSKok72mwJ5cqg1oVIdUi-hrfuyR6klF3mSoDIcn1uzF8---kOrSWkJzapMfIggCZVUSryGz0lKqIT4hDb7joizJY2RKYpJgnKfsNOUK6kzkhEp0QaWp7sbwaXORaQdlTYUgktKmJJnbodBmlPfwc3nf_3yDl7-BEWK1yBpmiUl2lEBZ6sE1d4fSYsdpuCByZfEVKNO5jLDSP0A9r949sd_3MGBS7piJMHr1obWJCbPte0pSklW2HBJd4mkGhcU4fTHVEZcxDZcfnBpw6_WRMl3ssyGjzHBlSCpDagi9wwe57Sie0aEIuVGr8vCHeIw7eVJZ9V62SbZhwk8ELsbFCA5g0zwTJRkvsMmGCny_9dkZjy5WulYcMqUNLsSBLqL884hdIMRBAGcu8EY_DH4A9cfgB-6fgiB73oB-AH4Y3c8hqEbBuVYNa-UC91zv9CkNRftYLHmnTrC53_5Z5WyDdeHnGbSnuDi5bvXJ4ZjPF8TqvAaokIRqhJxRqksVUogWZbQqKxKrZPOShCV05IWb7d2JQJrgcuLueX2dAtRkVAxJxJIlE7tR_lGUAHJye63MVVaX-MAN-2RDuTqO31ums1Z4ZRlWwseX8FT_WzJmXKWJKXJ1QROPswZVfzEBnklFaZOTm1jvSNR0OV9LZASsaJsAp65y0gcU7aaQCAwBV9gaoYXJHq0Ejxn8QTuLQfL4TI04xFPuJjAPT_0SVBoiKnMEnI1gWWCWzPyeS4VXV45RXVTE4j0MVLcn7Mv5uxHKcaUwGkmcIlCOkajI6M1pjiBmIhHZ4VjexcPzPGWvu-P7xdPKoOW_eWgtPELs45bvV4odKRkW4B9AqPQywpDywF9GLjFFX3hFHWQcjbRy-UpM49WJJuA7w6LkFUrli8xzJqmHyMJXbFGCBoh94ywPh-1dZi3GoWK2iLKdDvo1IYZtY6GoWwpN1Z5lVWtxfrFam447MqyWC3IqT8Y2ODZEPh9GzzXC8-KeVzEKCbgZ1uQPKFx5-ygOdkRJKa5nMD5-XkZbYNUSa9RGxMGlRFm-ImpaRMYe14LZ0W9auDWWXCleKpVjLtDv_YbxCiW8xs-t5YLy-VqTuj_ffASVAqFIzMSmRg6nusFrTWr9ydHS3ruea2mcmY0GA_CxREJX4cUB4vu4zQg_UV4v4l9_WblAESvAevgILhm13t6XBrM3y0guRdH8RLDLlT4gxIUNT79fdgXfOvINYn5E52RQbaFwMu2BeY82_y73uDs24Ru78aBI_7IPw-CsqiUxlbBDcZB3Mf62auNC4ZnzUp00AzclpRXUHpcx-eICWEjWYeLrYMOOvh3pEOpszpYNgBXnKYN4NxmD_O0UVcHVZ1dl_rrgUM0VON3D8rte0yJbrkWlD3a-9Aw0i0aLXj6ygLonx156BZxOJIM-uc2jMLis5esQZd1lIgwrCuNLu5VmHx31LFTV5EfjIfD0fm3Bn_WSGK0iIfo11Wj8Wan2oKbPOhys1-y0N0fwqv91mBUcV1NOjYjA9nufqNrnfZO5CS4VBPo7ytNCccObHkQZlvzaYexIdHOyeiWnAxLT5tH8Q5f68pZu3v8oDSxGG_vqXV9G712fWsb1likncDh0K4-RVyr9Lfk1_2uLS18jV20WZQaLxoKtfrKkeoqwQnoQ8oBPDrg__qbmOeObjEhoXeqwUUdUUSoLqV3xc2gAk7jMH5ckmudh7XrAF6mUJo6X55AX9pqNmmlzSLCWWliIFOnfujFuLK7G7_-GXhv2s2fgUyX3CJhE1UH8nVZqK3s3gRfelJw9wen7mbYIPU4RB3VZmyKjdvZ-DZ7zPo0cdjW1OUkbDazh13rLcXdJCfGiAtSILVGvIkvLQbNtX4VpnePobQbRhYjR1GZrPmmOmu0PBoTz1uM9itoreUCCVH461PHz7YmRZZt6Z8beIJuwlenJz_TB6Zbf4iEaE30O0t0T87uW_ann9lPLWVNrNactxrylm3F1sRq_bSof2_YL9A4_WpbrEn1jsL64rP_AQ';

function openSecurityPage() {
  const currentOrigin = `${window.location.origin}${window.location.pathname}`;
  const secUrl = `${currentOrigin}?view=1#c=${SECURITY_PAGE_HASH}`;
  window.open(secUrl, '_blank');
}

const state = {
  html: '',
  css: '',
  js: '',
  permissions: [],
  embed: {
    title: '',
    description: '',
    color: '#9000d5'
  },
  activeTab: 'html',
  consoleCount: 0,
  mobileView: 'editor', // 'editor' ou 'preview'
  qrInstance: null,
  lastValidUrl: ''
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
  btnOpenScreen: document.getElementById('btn-open-screen'),
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
    permissions: document.getElementById('tab-permissions'),
    embed: document.getElementById('tab-embed'),
    console: document.getElementById('tab-console')
  },
  wrappers: {
    html: document.getElementById('wrapper-html'),
    css: document.getElementById('wrapper-css'),
    js: document.getElementById('wrapper-js'),
    permissions: document.getElementById('wrapper-permissions'),
    embed: document.getElementById('wrapper-embed'),
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

  // Permissions
  permCount: document.getElementById('perm-count'),
  permsCheckboxes: document.querySelectorAll('.perm-checkbox'),
  permsStatusText: document.getElementById('perms-status-text'),
  btnTestPermModal: document.getElementById('btn-test-perm-modal'),
  cbOpenLinks: document.getElementById('perm-cb-open-links'),
  rowDomainOpenLinks: document.getElementById('row-domain-open-links'),
  inputOpenLinksDomains: document.getElementById('input-open-links-domains'),
  cbAllowIframes: document.getElementById('perm-cb-allow-iframes'),
  rowDomainAllowIframes: document.getElementById('row-domain-allow-iframes'),
  inputAllowIframesDomains: document.getElementById('input-allow-iframes-domains'),

  // Embed
  embedTitleInput: document.getElementById('embed-title-input'),
  embedDescInput: document.getElementById('embed-desc-input'),
  embedColorPicker: document.getElementById('embed-color-picker'),
  embedColorText: document.getElementById('embed-color-text'),
  colorPresetBtns: document.querySelectorAll('.color-preset-btn'),
  discordPreviewBar: document.getElementById('discord-embed-bar'),
  discordPreviewTitle: document.getElementById('discord-preview-title'),
  discordPreviewDesc: document.getElementById('discord-preview-desc'),
  embedIframeCode: document.getElementById('embed-iframe-code'),
  btnCopyIframeCode: document.getElementById('btn-copy-iframe-code'),

  // Mode Site Hébergé & Information
  hostedBanner: document.getElementById('hosted-overlay-banner'),
  btnHostedMinimize: document.getElementById('btn-hosted-minimize'),
  btnHostedInfo: document.getElementById('btn-hosted-info'),
  modalHostedInfo: document.getElementById('modal-hosted-info'),
  btnOpenSecPage: document.getElementById('btn-open-sec-page'),

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
  }, 2400);
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
    if (DOM.tabs[t]) DOM.tabs[t].classList.toggle('active', isActive);
    if (DOM.wrappers[t]) DOM.wrappers[t].classList.toggle('active', isActive);
  });
  if (['html', 'css', 'js'].includes(name)) {
    updateLineNumbers(name);
  }
}

Object.keys(DOM.tabs).forEach(t => {
  if (DOM.tabs[t]) {
    DOM.tabs[t].addEventListener('click', () => switchTab(t));
  }
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

// Mise à jour de l'aperçu Discord et code d'intégration
function updateDiscordPreview() {
  const title = state.embed.title.trim() || 'Mon Application Web';
  const desc = state.embed.description.trim() || 'Développé et partagé sans serveur avec HTML in URL.';
  const color = state.embed.color || '#9000d5';

  if (DOM.discordPreviewTitle) DOM.discordPreviewTitle.textContent = title;
  if (DOM.discordPreviewDesc) DOM.discordPreviewDesc.textContent = desc;
  if (DOM.discordPreviewBar) DOM.discordPreviewBar.style.backgroundColor = color;
}

function updateEmbedIframeCode(url) {
  if (!DOM.embedIframeCode) return;
  const targetUrl = url || DOM.urlDisplay.value || window.location.href;
  try {
    const viewUrl = new URL(targetUrl);
    viewUrl.searchParams.set('view', '1');
    const allowAttrs = 'camera; microphone; geolocation; clipboard-read; clipboard-write; display-capture';
    DOM.embedIframeCode.value = `<iframe src="${viewUrl.toString()}" width="100%" height="500" frameborder="0" allow="${allowAttrs}" sandbox="allow-scripts allow-forms allow-modals allow-downloads"></iframe>`;
  } catch {
    DOM.embedIframeCode.value = `<iframe src="${targetUrl}" width="100%" height="500" frameborder="0"></iframe>`;
  }
}

// Encodage et mise à jour de l'URL (Limite stricte à 6 144 caractères)
async function syncUrl() {
  const { compressed } = await encodePayload({
    html: state.html,
    css: state.css,
    js: state.js,
    permissions: state.permissions,
    embed: state.embed
  });

  const hash = compressed ? `#c=${compressed}` : '';
  const currentOriginPath = `${window.location.origin}${window.location.pathname}`;
  const fullUrl = `${currentOriginPath}${hash}`;
  const urlLen = fullUrl.length;

  DOM.charCounter.textContent = `${urlLen} / ${MAX_CHARS} car.`;
  DOM.charCounter.className = 'char-count';

  // Si dépassement de la limite de 6 144 caractères
  if (urlLen > MAX_CHARS) {
    DOM.charCounter.classList.add('danger');
    DOM.urlDisplay.classList.add('url-exceeded');
    DOM.btnCopyUrl.disabled = true;
    DOM.btnOpenScreen.disabled = true;
    DOM.btnOpenQr.disabled = true;
    showToast(`Limite dépassée (${urlLen} / ${MAX_CHARS} car.) — Non enregistré dans l'URL.`);
    // Ne pas remplacer l'URL dans l'historique quand la limite est dépassée
    return;
  }

  DOM.urlDisplay.classList.remove('url-exceeded');
  DOM.btnCopyUrl.disabled = false;
  DOM.btnOpenScreen.disabled = false;

  if (urlLen > 5000) {
    DOM.charCounter.classList.add('warning');
  }

  window.history.replaceState(null, '', hash || window.location.pathname);
  DOM.urlDisplay.value = fullUrl;
  state.lastValidUrl = fullUrl;

  updateEmbedIframeCode(fullUrl);

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
    js: state.js,
    permissions: state.permissions,
    embed: state.embed
  });
}

// Synchroniser l'état des autorisations avec l'interface
function syncPermissionsUI() {
  const checkboxes = document.querySelectorAll('.perm-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = state.permissions.some(p => p === cb.value || p.startsWith(cb.value + ':'));
  });

  const openLinksItem = state.permissions.find(p => p === 'open-links' || p.startsWith('open-links:'));
  if (openLinksItem) {
    if (DOM.rowDomainOpenLinks) DOM.rowDomainOpenLinks.style.display = 'flex';
    if (DOM.inputOpenLinksDomains) {
      DOM.inputOpenLinksDomains.value = openLinksItem.includes(':') ? openLinksItem.split(':')[1] : '';
    }
  } else if (DOM.rowDomainOpenLinks) {
    DOM.rowDomainOpenLinks.style.display = 'none';
  }

  const allowIframesItem = state.permissions.find(p => p === 'allow-iframes' || p.startsWith('allow-iframes:'));
  if (allowIframesItem) {
    if (DOM.rowDomainAllowIframes) DOM.rowDomainAllowIframes.style.display = 'flex';
    if (DOM.inputAllowIframesDomains) {
      DOM.inputAllowIframesDomains.value = allowIframesItem.includes(':') ? allowIframesItem.split(':')[1] : '';
    }
  } else if (DOM.rowDomainAllowIframes) {
    DOM.rowDomainAllowIframes.style.display = 'none';
  }

  const count = state.permissions.length;
  if (DOM.permCount) DOM.permCount.textContent = count;
  if (DOM.permsStatusText) {
    DOM.permsStatusText.textContent = count === 0
      ? '0 autorisation activée'
      : `${count} autorisation${count > 1 ? 's' : ''} activée${count > 1 ? 's' : ''}`;
  }
}

// Synchroniser l'état de l'Embed avec l'interface
function syncEmbedUI() {
  if (DOM.embedTitleInput) DOM.embedTitleInput.value = state.embed.title || '';
  if (DOM.embedDescInput) DOM.embedDescInput.value = state.embed.description || '';
  const color = state.embed.color || '#9000d5';
  if (DOM.embedColorPicker) DOM.embedColorPicker.value = color;
  if (DOM.embedColorText) DOM.embedColorText.value = color;
  updateDiscordPreview();
}

// Chargement depuis le hash URL
async function loadFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const isHostedView = urlParams.get('view') === '1' || window.location.hash.includes('view=1');

  if (isHostedView) {
    document.body.classList.add('mode-hosted-view');
    // Affichage de la notification pendant 20 secondes et une seule fois par session
    const hasSeenBanner = sessionStorage.getItem('pinou_hosted_banner_seen');
    if (!hasSeenBanner && DOM.hostedBanner) {
      DOM.hostedBanner.classList.add('visible');
      sessionStorage.setItem('pinou_hosted_banner_seen', '1');
      if (window.hostedBannerTimeout) clearTimeout(window.hostedBannerTimeout);
      window.hostedBannerTimeout = setTimeout(() => {
        hideHostedBanner();
      }, 20000);
    } else if (DOM.hostedBanner) {
      DOM.hostedBanner.classList.remove('visible');
    }
  } else {
    document.body.classList.remove('mode-hosted-view');
  }

  const hash = window.location.hash.replace(/^#/, '');
  let compressed = '';

  if (hash.startsWith('c=')) {
    compressed = hash.substring(2);
  } else if (hash.includes('c=')) {
    const params = new URLSearchParams(hash);
    compressed = params.get('c') || '';
  } else if (hash && !hash.startsWith('view=')) {
    compressed = hash;
  }

  if (compressed) {
    try {
      const decoded = await decodePayload(compressed);
      state.html = decoded.html || '';
      state.css = decoded.css || '';
      state.js = decoded.js || '';
      state.permissions = Array.isArray(decoded.permissions) ? decoded.permissions : [];
      state.embed = decoded.embed || { title: '', description: '', color: '#9000d5' };
    } catch {
      state.html = DEFAULT_CODE.html;
      state.css = DEFAULT_CODE.css;
      state.js = DEFAULT_CODE.js;
      state.permissions = [];
      state.embed = { title: '', description: '', color: '#9000d5' };
    }
  } else {
    state.html = DEFAULT_CODE.html;
    state.css = DEFAULT_CODE.css;
    state.js = DEFAULT_CODE.js;
    state.permissions = [];
    state.embed = { title: '', description: '', color: '#9000d5' };
  }

  DOM.textareas.html.value = state.html;
  DOM.textareas.css.value = state.css;
  DOM.textareas.js.value = state.js;

  syncPermissionsUI();
  syncEmbedUI();

  ['html', 'css', 'js'].forEach(updateLineNumbers);
  renderPreview();
  syncUrl();
}

// Événements Onglet Autorisations (Standard & Personnalisées)
// Pour open-links et allow-iframes : le domaine est OBLIGATOIRE
function updateCustomPermission(prefix, isChecked, domainsVal) {
  state.permissions = state.permissions.filter(p => !p.startsWith(prefix));
  if (isChecked) {
    const trimmed = (domainsVal || '').trim();
    if (!trimmed) {
      // Domaine obligatoire : on coche pas si vide
      return;
    }
    state.permissions.push(`${prefix}:${trimmed}`);
  }
  syncPermissionsUI();
  triggerAutoSync();
}

if (DOM.cbOpenLinks) {
  DOM.cbOpenLinks.addEventListener('change', () => {
    if (DOM.cbOpenLinks.checked) {
      const domains = DOM.inputOpenLinksDomains ? DOM.inputOpenLinksDomains.value.trim() : '';
      if (!domains) {
        // Forcer le retour décoché + afficher message
        DOM.cbOpenLinks.checked = false;
        showToast('Renseignez au moins un domaine autorisé avant d\'activer cette permission.');
        if (DOM.rowDomainOpenLinks) DOM.rowDomainOpenLinks.style.display = 'flex';
        if (DOM.inputOpenLinksDomains) DOM.inputOpenLinksDomains.focus();
        return;
      }
    }
    // Afficher/masquer la rangée domaine
    if (DOM.rowDomainOpenLinks) {
      DOM.rowDomainOpenLinks.style.display = DOM.cbOpenLinks.checked ? 'flex' : 'none';
    }
    updateCustomPermission('open-links', DOM.cbOpenLinks.checked, DOM.inputOpenLinksDomains ? DOM.inputOpenLinksDomains.value : '');
  });
}

if (DOM.inputOpenLinksDomains) {
  DOM.inputOpenLinksDomains.addEventListener('input', () => {
    if (DOM.cbOpenLinks && DOM.cbOpenLinks.checked) {
      updateCustomPermission('open-links', true, DOM.inputOpenLinksDomains.value);
    }
  });
}

if (DOM.cbAllowIframes) {
  DOM.cbAllowIframes.addEventListener('change', () => {
    if (DOM.cbAllowIframes.checked) {
      const domains = DOM.inputAllowIframesDomains ? DOM.inputAllowIframesDomains.value.trim() : '';
      if (!domains) {
        DOM.cbAllowIframes.checked = false;
        showToast('Renseignez au moins un domaine autorisé avant d\'activer cette permission.');
        if (DOM.rowDomainAllowIframes) DOM.rowDomainAllowIframes.style.display = 'flex';
        if (DOM.inputAllowIframesDomains) DOM.inputAllowIframesDomains.focus();
        return;
      }
    }
    // Afficher/masquer la rangée domaine
    if (DOM.rowDomainAllowIframes) {
      DOM.rowDomainAllowIframes.style.display = DOM.cbAllowIframes.checked ? 'flex' : 'none';
    }
    updateCustomPermission('allow-iframes', DOM.cbAllowIframes.checked, DOM.inputAllowIframesDomains ? DOM.inputAllowIframesDomains.value : '');
  });
}

if (DOM.inputAllowIframesDomains) {
  DOM.inputAllowIframesDomains.addEventListener('input', () => {
    if (DOM.cbAllowIframes && DOM.cbAllowIframes.checked) {
      updateCustomPermission('allow-iframes', true, DOM.inputAllowIframesDomains.value);
    }
  });
}

document.querySelectorAll('.perm-checkbox:not(#perm-cb-open-links):not(#perm-cb-allow-iframes)').forEach(cb => {
  cb.addEventListener('change', () => {
    if (cb.checked) {
      if (!state.permissions.includes(cb.value)) state.permissions.push(cb.value);
    } else {
      state.permissions = state.permissions.filter(p => p !== cb.value);
    }
    syncPermissionsUI();
    triggerAutoSync();
  });
});

if (DOM.btnTestPermModal) {
  DOM.btnTestPermModal.addEventListener('click', () => {
    if (state.permissions.length === 0) {
      showToast('Activez d\'abord une ou plusieurs permissions à tester.');
      return;
    }
    renderPreview();
    showToast('Écran de demande d\'autorisations affiché dans l\'aperçu !');
  });
}

// Événements Onglet Embed
if (DOM.embedTitleInput) {
  DOM.embedTitleInput.addEventListener('input', () => {
    state.embed.title = DOM.embedTitleInput.value;
    updateDiscordPreview();
    triggerAutoSync();
  });
}

if (DOM.embedDescInput) {
  DOM.embedDescInput.addEventListener('input', () => {
    state.embed.description = DOM.embedDescInput.value;
    updateDiscordPreview();
    triggerAutoSync();
  });
}

function setEmbedColor(color) {
  state.embed.color = color;
  if (DOM.embedColorPicker) DOM.embedColorPicker.value = color;
  if (DOM.embedColorText) DOM.embedColorText.value = color;
  updateDiscordPreview();
  triggerAutoSync();
}

if (DOM.embedColorPicker) {
  DOM.embedColorPicker.addEventListener('input', (e) => setEmbedColor(e.target.value));
}

if (DOM.embedColorText) {
  DOM.embedColorText.addEventListener('input', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setEmbedColor(val);
    }
  });
}

DOM.colorPresetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const c = btn.getAttribute('data-color');
    if (c) setEmbedColor(c);
  });
});

if (DOM.btnCopyIframeCode) {
  DOM.btnCopyIframeCode.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(DOM.embedIframeCode.value);
      showToast('Code d\'intégration Iframe copié !');
    } catch {
      DOM.embedIframeCode.select();
      document.execCommand('copy');
      showToast('Code d\'intégration Iframe copié !');
    }
  });
}

// Bouton Écran : ouvrir en mode site hébergé dans un nouvel onglet
if (DOM.btnOpenScreen) {
  DOM.btnOpenScreen.addEventListener('click', () => {
    const currentUrl = DOM.urlDisplay.value || window.location.href;
    const url = new URL(currentUrl);
    url.searchParams.set('view', '1');
    window.open(url.toString(), '_blank');
  });
}

// Fonction pour masquer la bannière du mode hébergé
function hideHostedBanner() {
  if (DOM.hostedBanner) {
    DOM.hostedBanner.classList.add('banner-hide');
    setTimeout(() => {
      DOM.hostedBanner.classList.remove('visible', 'banner-hide');
    }, 350);
  }
}

// Fermeture manuelle de la bannière
if (DOM.btnHostedMinimize) {
  DOM.btnHostedMinimize.addEventListener('click', () => {
    hideHostedBanner();
  });
}

// Bouton Picto d'information (En bas à gauche)
if (DOM.btnHostedInfo) {
  DOM.btnHostedInfo.addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isHostedView = urlParams.get('view') === '1' || window.location.hash.includes('view=1');
    if (isHostedView) {
      // Ouvre directement la page de sécurité propulsée par HTML in URL
      openSecurityPage();
    } else if (DOM.modalHostedInfo) {
      DOM.modalHostedInfo.classList.add('open');
    }
  });
}

// Bouton dans la modale pour ouvrir la page de sécurité HTML in URL
if (DOM.btnOpenSecPage) {
  DOM.btnOpenSecPage.addEventListener('click', () => {
    openSecurityPage();
  });
}

if (DOM.modalHostedInfo) {
  DOM.modalHostedInfo.addEventListener('click', (e) => {
    if (e.target === DOM.modalHostedInfo) {
      DOM.modalHostedInfo.classList.remove('open');
    }
  });
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
    permissions: state.permissions,
    embed: state.embed
  });

  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(state.embed.title || 'projet').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.html`;
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
  if (e.key === 'Escape') {
    if (DOM.modalQr) DOM.modalQr.classList.remove('open');
    if (DOM.modalHostedInfo) DOM.modalHostedInfo.classList.remove('open');
  }
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
    if (state.currentView === 'preview') {
      setViewMode('editor');
    } else {
      setViewMode('preview');
    }
  } else {
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
    DOM.previewFrame.style.pointerEvents = 'auto';
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

