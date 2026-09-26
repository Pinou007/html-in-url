/**
 * sandbox.js - Sandbox iframe sécurisée et étanche
 * 100% exécuté côté client dans le navigateur (parfait pour GitHub Pages)
 * - Aucune iframe imbriquée (CSP frame-src 'none' et remplacement visuel)
 * - Aucune redirection ni window.open
 * - Pas de allow-same-origin (isolation totale)
 * - Console relayée par postMessage vers l'onglet Console
 * - Gestion de la pop-up de demande d'autorisations (caméra, micro, etc.)
 */

export const PERMISSION_ITEMS = {
  camera: {
    id: 'camera',
    label: 'Caméra (Webcam)',
    desc: 'Accès au flux vidéo de la caméra',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`
  },
  microphone: {
    id: 'microphone',
    label: 'Microphone',
    desc: 'Accès au son et enregistrement audio',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
  },
  geolocation: {
    id: 'geolocation',
    label: 'Géolocalisation',
    desc: 'Accès à la position GPS de l\'appareil',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
  },
  'clipboard-read': {
    id: 'clipboard-read',
    label: 'Lecture Presse-papiers',
    desc: 'Lire le contenu copié dans le presse-papiers',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="13" y2="16"></line></svg>`
  },
  'clipboard-write': {
    id: 'clipboard-write',
    label: 'Écriture Presse-papiers',
    desc: 'Copier automatiquement du texte',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
  },
  'open-links': {
    id: 'open-links',
    label: 'Liens & Nouvelles Pages',
    desc: 'Ouvrir des onglets et liens externes',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
  },
  'allow-iframes': {
    id: 'allow-iframes',
    label: 'Iframes & Embeds Externes',
    desc: 'Intégrer des sites et vidéos par domaine',
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><polyline points="8 21 12 17 16 21"></polyline></svg>`
  }
};

// Remplacement des balises iframe par un bloc visuel explicite si non autorisées
export function sanitizeIframes(html, { hasIframePerm = false, allowedIframeDomains = [] } = {}) {
  if (!html) return '';
  const blockedHtml = `<div class="iframe-blocked-box" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;margin:8px 0;border:1.5px dashed #ef4444;background:rgba(239,68,68,0.08);border-radius:8px;color:#ef4444;font-family:'Nunito',system-ui,sans-serif;font-size:13px;font-weight:700;text-align:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg><span>Iframe désactivée (bloquée pour votre sécurité)</span></div>`;

  if (!hasIframePerm) {
    return html
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, blockedHtml)
      .replace(/<iframe[^>]*\/?>/gi, blockedHtml)
      .replace(/<frame[\s\S]*?<\/frame>/gi, blockedHtml)
      .replace(/<frame[^>]*\/?>/gi, blockedHtml)
      .replace(/<embed[\s\S]*?<\/embed>/gi, blockedHtml)
      .replace(/<embed[^>]*\/?>/gi, blockedHtml);
  }

  // Si hasIframePerm est actif sans filtre de domaine = tout autoriser
  if (hasIframePerm && allowedIframeDomains.length === 0) return html;

  // Si hasIframePerm est actif avec filtrage de domaine
  if (allowedIframeDomains.length > 0) {
    return html.replace(/<iframe([\s\S]*?)<\/iframe>|<iframe([\s\S]*?)\/?>/gi, (match, p1, p2) => {
      const attrs = p1 || p2 || '';
      const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        try {
          const u = new URL(srcMatch[1], 'https://example.com');
          const h = u.hostname.toLowerCase();
          const isAllowed = allowedIframeDomains.some(d => h === d || h.endsWith('.' + d));
          if (isAllowed) return match;
        } catch(e) {}
      }
      return blockedHtml;
    });
  }

  return html;
}

export function buildSandboxDocument({
  html = '',
  css = '',
  js = '',
  permissions = [],
  embed = {}
}) {
  // Extraction des permissions spéciales (liens et iframes avec domaines éventuels)
  const openLinksPerm = (permissions || []).find(p => p === 'open-links' || p.startsWith('open-links:'));
  const allowIframesPerm = (permissions || []).find(p => p === 'allow-iframes' || p.startsWith('allow-iframes:'));
  const allowedLinkDomains = openLinksPerm && openLinksPerm.includes(':')
    ? openLinksPerm.split(':')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const allowedIframeDomains = allowIframesPerm && allowIframesPerm.includes(':')
    ? allowIframesPerm.split(':')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const hasLinkPerm = Boolean(openLinksPerm);
  const hasIframePerm = Boolean(allowIframesPerm);

  const sanitizedHtml = sanitizeIframes(html, { hasIframePerm, allowedIframeDomains });

  const securityScript = `
    <script>
      (function() {
        const ALLOW_LINKS = ${hasLinkPerm};
        const ALLOWED_LINK_DOMAINS = ${JSON.stringify(allowedLinkDomains)};
        const ALLOW_IFRAMES = ${hasIframePerm};
        const ALLOWED_IFRAME_DOMAINS = ${JSON.stringify(allowedIframeDomains)};

        function isDomainAllowed(urlStr, allowedList) {
          // Liste vide = tout autoriser
          if (!allowedList || allowedList.length === 0) return true;
          try {
            const u = new URL(urlStr, window.location.href);
            const h = u.hostname.toLowerCase();
            return allowedList.some(d => h === d || h.endsWith('.' + d));
          } catch(e) {
            return false;
          }
        }

        const block = function(action) {
          console.warn('[Sandbox Sécurité] Bloqué :', action);
          return false;
        };

        const origOpen = window.open;
        window.open = function(url, target, features) {
          if (ALLOW_LINKS && isDomainAllowed(url, ALLOWED_LINK_DOMAINS)) {
            return origOpen ? origOpen.call(window, url, '_blank', 'noopener,noreferrer') : null;
          }
          console.warn('[Sandbox Sécurité] window.open bloqué (autorisation requise) :', url);
          return null;
        };

        try {
          window.location.assign = block;
          window.location.replace = block;
          Object.defineProperty(window.location, 'href', {
            set: function(val) { block('location.href = ' + val); },
            get: function() { return 'about:blank'; }
          });
        } catch(e) {}

        // Gestion des clics sur les liens
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a');
          if (a && a.href && !a.href.startsWith('javascript:')) {
            e.preventDefault();
            e.stopPropagation();
            if (ALLOW_LINKS && isDomainAllowed(a.href, ALLOWED_LINK_DOMAINS)) {
              window.open(a.href, '_blank', 'noopener,noreferrer');
            } else {
              console.warn('[Sandbox Sécurité] Navigation bloquée (autorisation requise) :', a.href);
            }
          }
        }, true);

        // Bloquer les formulaires externes
        document.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('[Sandbox Sécurité] Envoi de formulaire bloqué.');
        }, true);

        // Créer un badge visuel pour toute iframe bloquée
        function createBlockedBadge() {
          const div = document.createElement('div');
          div.className = 'iframe-blocked-box';
          div.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;margin:8px 0;border:1.5px dashed #ef4444;background:rgba(239,68,68,0.08);border-radius:8px;color:#ef4444;font-family:\'Nunito\',system-ui,sans-serif;font-size:13px;font-weight:700;text-align:center;';
          div.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg><span>Iframe désactivée (bloquée pour votre sécurité)</span>';
          return div;
        }

        // Empêcher la création d'iframes dynamiques non autorisées
        const origCreate = document.createElement.bind(document);
        document.createElement = function(tag, opts) {
          if (typeof tag === 'string' && (tag.toLowerCase() === 'iframe' || tag.toLowerCase() === 'frame' || tag.toLowerCase() === 'embed')) {
            if (!ALLOW_IFRAMES) {
              console.warn('[Sandbox Sécurité] Création d\\'iframe bloquée.');
              return createBlockedBadge();
            }
            const elem = origCreate(tag, opts);
            if (ALLOWED_IFRAME_DOMAINS.length > 0) {
              let currentSrc = '';
              Object.defineProperty(elem, 'src', {
                get: function() { return currentSrc; },
                set: function(val) {
                  if (isDomainAllowed(val, ALLOWED_IFRAME_DOMAINS)) {
                    currentSrc = val;
                    elem.setAttribute('src', val);
                  } else {
                    console.warn('[Sandbox Sécurité] Iframe src bloqué (domaine non autorisé) :', val);
                    const badge = createBlockedBadge();
                    if (elem.parentNode) elem.parentNode.replaceChild(badge, elem);
                  }
                }
              });
            }
            return elem;
          }
          return origCreate(tag, opts);
        };

        // Observer pour remplacer les iframes non autorisées injectées via innerHTML
        try {
          const obs = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
              m.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                  const checkNode = function(el) {
                    if (el.tagName === 'IFRAME' || el.tagName === 'FRAME' || el.tagName === 'EMBED') {
                      if (!ALLOW_IFRAMES) {
                        const repl = createBlockedBadge();
                        if (el.parentNode) el.parentNode.replaceChild(repl, el);
                      } else if (ALLOWED_IFRAME_DOMAINS.length > 0) {
                        const s = el.getAttribute('src') || '';
                        if (!isDomainAllowed(s, ALLOWED_IFRAME_DOMAINS)) {
                          const repl = createBlockedBadge();
                          if (el.parentNode) el.parentNode.replaceChild(repl, el);
                        }
                      }
                    }
                  };
                  checkNode(node);
                  if (node.querySelectorAll) {
                    node.querySelectorAll('iframe, frame, embed').forEach(checkNode);
                  }
                }
              });
            });
          });
          obs.observe(document.documentElement, { childList: true, subtree: true });
        } catch(e) {}

        // Relayer la console vers l'application
        function sendLog(level, args) {
          try {
            const formatted = Array.from(args).map(arg => {
              if (arg === undefined) return 'undefined';
              if (arg === null) return 'null';
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
              }
              return String(arg);
            }).join(' ');

            window.parent.postMessage({
              type: 'sandbox-console',
              level: level,
              text: formatted,
              time: new Date().toLocaleTimeString()
            }, '*');
          } catch(e) {}
        }

        ['log', 'info', 'warn', 'error'].forEach(function(level) {
          const orig = console[level];
          console[level] = function() {
            if (orig) orig.apply(console, arguments);
            sendLog(level, arguments);
          };
        });

        window.addEventListener('error', function(ev) {
          sendLog('error', ['Erreur : ' + (ev.message || 'Inconnue') + ' (Ligne ' + (ev.lineno || '?') + ')']);
        });

        window.addEventListener('unhandledrejection', function(ev) {
          sendLog('error', ['Promesse rejetée : ' + (ev.reason ? (ev.reason.message || ev.reason) : 'Inconnue')]);
        });
      })();
    </script>
  `;

  // Construction de l'écran plein (Full Screen) pour les autorisations avec boutons individuels
  const hasPermissions = Array.isArray(permissions) && permissions.length > 0;
  let permModalHtml = '';
  let permScript = '';

  if (hasPermissions) {
    const listItems = permissions.map(p => {
      let key = p;
      let domainNotice = '';
      if (p.startsWith('open-links')) {
        key = 'open-links';
        const d = p.includes(':') ? p.split(':')[1] : '';
        domainNotice = d ? `Domaines autorisés : ${d}` : 'Aucun domaine renseigné (bloqué)';
      } else if (p.startsWith('allow-iframes')) {
        key = 'allow-iframes';
        const d = p.includes(':') ? p.split(':')[1] : '';
        domainNotice = d ? `Domaines iframes autorisés : ${d}` : 'Aucun domaine renseigné (bloqué)';
      } else if (p === 'clipboard') {
        key = 'clipboard-read';
      } else if (p === 'screen') {
        key = 'display-capture';
      }

      const item = PERMISSION_ITEMS[key] || {
        label: p,
        desc: 'Autorisation spéciale',
        svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`
      };

      return `
        <div class="perm-full-row">
          <div class="perm-full-icon-box">${item.svg}</div>
          <div class="perm-full-text">
            <span class="perm-full-label">${item.label}</span>
            <span class="perm-full-sub">${domainNotice || item.desc}</span>
          </div>
          <button type="button" class="perm-row-action-btn" data-perm="${p}">
            Autoriser
          </button>
        </div>
      `;
    }).join('');

    permModalHtml = `
      <div id="__perm_fullscreen" class="perm-fullscreen-screen">
        <div class="perm-fullscreen-card">
          <div class="perm-fullscreen-header">
            <div class="perm-shield-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9000d5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h2 class="perm-full-title">Demande d'autorisations</h2>
              <p class="perm-full-desc">Cette page web souhaite accéder aux fonctionnalités suivantes :</p>
            </div>
          </div>

          <div class="perm-full-list">
            ${listItems}
          </div>

          <div class="perm-full-warning">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <strong>Site sans serveur hébergé via html.pinou007.fr</strong><br>
            Vous devez cliquer sur <em>« Autoriser »</em> pour chaque fonctionnalité afin de déverrouiller la page.
          </div>

          <div class="perm-full-actions">
            <button type="button" id="__btn_allow_all" class="perm-full-btn allow disabled" disabled>
              Autoriser et ouvrir la page
            </button>
            <button type="button" id="__btn_deny_all" class="perm-full-btn deny">
              Refuser et continuer sans permissions
            </button>
          </div>
        </div>
      </div>
    `;

    permScript = `
      <script>
        (function() {
          const screen = document.getElementById('__perm_fullscreen');
          const btnAllow = document.getElementById('__btn_allow_all');
          const btnDeny = document.getElementById('__btn_deny_all');
          const rowBtns = document.querySelectorAll('.perm-row-action-btn');
          const requiredPerms = ${JSON.stringify(permissions)};
          const grantedState = {};

          function revealPage() {
            if (screen) {
              screen.style.opacity = '0';
              screen.style.transform = 'scale(0.98)';
              screen.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
              setTimeout(() => screen.remove(), 260);
            }
          }

          function checkAllGranted() {
            const allGranted = requiredPerms.every(p => grantedState[p]);
            if (allGranted && btnAllow) {
              btnAllow.disabled = false;
              btnAllow.classList.remove('disabled');
              btnAllow.classList.add('ready');
            }
          }

          rowBtns.forEach(btn => {
            btn.addEventListener('click', async function() {
              const p = btn.getAttribute('data-perm');
              btn.textContent = 'En cours...';
              btn.disabled = true;

              let baseKey = p;
              if (p.startsWith('open-links')) baseKey = 'open-links';
              else if (p.startsWith('allow-iframes')) baseKey = 'allow-iframes';
              else if (p === 'clipboard') baseKey = 'clipboard-read';
              else if (p === 'screen') baseKey = 'display-capture';

              try {
                if (baseKey === 'camera' || baseKey === 'microphone') {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    await navigator.mediaDevices.getUserMedia({
                      video: baseKey === 'camera',
                      audio: baseKey === 'microphone'
                    }).catch(err => console.warn('[Permissions] Cam/Mic :', err.message));
                  }
                } else if (baseKey === 'geolocation' && navigator.geolocation) {
                  await new Promise(res => navigator.geolocation.getCurrentPosition(res, () => res(), { timeout: 3500 }));
                } else if (baseKey === 'notifications' && typeof Notification !== 'undefined') {
                  await Notification.requestPermission().catch(() => {});
                } else if (baseKey === 'clipboard-read' && navigator.clipboard && navigator.clipboard.readText) {
                  await navigator.clipboard.readText().catch(() => {});
                } else if (baseKey === 'screen-wake-lock' && navigator.wakeLock) {
                  await navigator.wakeLock.request('screen').catch(() => {});
                } else if (baseKey === 'display-capture' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                  await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => {});
                } else if (baseKey === 'fullscreen' && document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen().catch(() => {});
                }
              } catch(e) {
                console.warn('[Permissions] Erreur :', e);
              }

              btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"></polyline></svg>Accordé';
              btn.classList.add('granted');
              grantedState[p] = true;
              checkAllGranted();
            });
          });

          if (btnAllow) {
            btnAllow.addEventListener('click', function() {
              revealPage();
            });
          }

          if (btnDeny) {
            btnDeny.addEventListener('click', function() {
              revealPage();
            });
          }
        })();
      </script>
    `;
  }

  const pageTitle = embed.title ? `${embed.title} | HTML in URL` : 'HTML in URL';
  const themeColor = embed.color || '#9000d5';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="theme-color" content="${themeColor}">
  ${embed.description ? `<meta name="description" content="${embed.description.replace(/"/g, '&quot;')}">` : ''}
  <meta http-equiv="Content-Security-Policy" content="frame-src 'none'; child-src 'none'; object-src 'none';">
  <!-- Police Nunito -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  ${securityScript}
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Nunito', system-ui, sans-serif;
      margin: 0;
      padding: 1rem;
      line-height: 1.5;
      color: inherit;
    }
    @media (prefers-color-scheme: dark) {
      body {
        color: #f3f4f6;
        background-color: transparent;
      }
    }

    /* Écran plein d'autorisations (Full Screen, pas une simple popup) */
    .perm-fullscreen-screen {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: #f4f5f8;
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: 'Nunito', system-ui, sans-serif;
      overflow-y: auto;
    }

    @media (prefers-color-scheme: dark) {
      .perm-fullscreen-screen {
        background: #0f1117;
      }
    }

    .perm-fullscreen-card {
      background: #ffffff;
      color: #181a20;
      border-radius: 14px;
      max-width: 520px;
      width: 100%;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
      border: 1px solid #dcdfe8;
    }

    @media (prefers-color-scheme: dark) {
      .perm-fullscreen-card {
        background: #161922;
        color: #f3f4f8;
        border-color: #272d3e;
      }
    }

    .perm-fullscreen-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 1.25rem;
    }

    .perm-shield-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(144, 0, 213, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .perm-full-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .perm-full-desc {
      margin: 4px 0 0 0;
      font-size: 0.85rem;
      color: #646a7c;
      line-height: 1.35;
    }

    @media (prefers-color-scheme: dark) {
      .perm-full-desc {
        color: #9ba1b4;
      }
    }

    .perm-full-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 1.25rem;
      max-height: 280px;
      overflow-y: auto;
    }

    .perm-full-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: #f4f5f8;
      border-radius: 8px;
      border: 1px solid #eceef3;
    }

    @media (prefers-color-scheme: dark) {
      .perm-full-row {
        background: #1e2230;
        border-color: #272d3e;
      }
    }

    .perm-full-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: rgba(144, 0, 213, 0.1);
      color: #9000d5;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .perm-full-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .perm-full-label {
      font-weight: 700;
      font-size: 0.88rem;
    }

    .perm-full-sub {
      font-size: 0.74rem;
      color: #646a7c;
    }

    @media (prefers-color-scheme: dark) {
      .perm-full-sub {
        color: #9ba1b4;
      }
    }

    .perm-row-action-btn {
      padding: 6px 12px;
      background: #9000d5;
      color: #ffffff;
      border: 1px solid #9000d5;
      border-radius: 6px;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .perm-row-action-btn:hover:not(:disabled) {
      background: #7b00b7;
    }

    .perm-row-action-btn.granted {
      background: #10b981;
      border-color: #10b981;
      color: #ffffff;
      cursor: default;
    }

    .perm-full-warning {
      padding: 10px 14px;
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
      border-radius: 6px;
      font-size: 0.76rem;
      color: #92400e;
      line-height: 1.4;
      margin-bottom: 1.5rem;
    }

    @media (prefers-color-scheme: dark) {
      .perm-full-warning {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
      }
    }

    .perm-full-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .perm-full-btn {
      width: 100%;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: background 0.15s ease, opacity 0.15s;
    }

    .perm-full-btn.allow {
      background: #9000d5;
      color: #ffffff;
      border: 1px solid #9000d5;
    }

    .perm-full-btn.allow.disabled {
      background: #64748b !important;
      border-color: #64748b !important;
      color: #94a3b8 !important;
      opacity: 0.55 !important;
      cursor: not-allowed !important;
      pointer-events: none !important;
    }

    .perm-full-btn.allow.ready {
      background: #9000d5 !important;
      border-color: #9000d5 !important;
      color: #ffffff !important;
      opacity: 1 !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    .perm-full-btn.allow:hover:not(.disabled) {
      background: #7b00b7;
    }

    .perm-full-btn.deny {
      background: transparent;
      border: 1px solid #dcdfe8;
      color: #646a7c;
    }

    .perm-full-btn.deny:hover {
      background: #f4f5f8;
      color: #181a20;
    }

    @media (prefers-color-scheme: dark) {
      .perm-full-btn.deny {
        border-color: #272d3e;
        color: #9ba1b4;
      }
      .perm-full-btn.deny:hover {
        background: #1e2230;
        color: #f3f4f8;
      }
    }

    ${css}
  </style>
</head>
<body>
  ${permModalHtml}
  ${sanitizedHtml}

  ${permScript}
  <script>
    try {
      ${js}
    } catch(err) {
      console.error('Erreur JavaScript :', err.message);
    }
  </script>
</body>
</html>`;
}

export function renderToIframe(iframeEl, options) {
  if (!iframeEl) return;
  iframeEl.srcdoc = buildSandboxDocument(options);
}

export function buildStandaloneExport({
  html = '',
  css = '',
  js = '',
  permissions = [],
  embed = {}
}) {
  const allowIframesPerm = (permissions || []).find(p => p === 'allow-iframes' || p.startsWith('allow-iframes:'));
  const allowedIframeDomains = allowIframesPerm && allowIframesPerm.includes(':')
    ? allowIframesPerm.split(':')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const hasIframePerm = Boolean(allowIframesPerm);
  const sanitizedHtml = sanitizeIframes(html, { hasIframePerm, allowedIframeDomains });
  const title = embed.title || 'Projet HTML in URL';
  const color = embed.color || '#9000d5';
  const desc = embed.description || '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="theme-color" content="${color}">
  ${desc ? `<meta name="description" content="${desc.replace(/"/g, '&quot;')}">` : ''}
  <meta property="og:title" content="${title}">
  ${desc ? `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Nunito', system-ui, sans-serif;
      margin: 0;
      padding: 1rem;
      padding-bottom: 3.5rem;
      line-height: 1.5;
    }
    .standalone-footer-notice {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #181a20;
      color: #9aa0b2;
      font-size: 0.72rem;
      padding: 0.4rem 1rem;
      text-align: center;
      border-top: 1px solid #272d3e;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .standalone-footer-notice strong {
      color: #ffffff;
    }
    ${css}
  </style>
</head>
<body>
  ${sanitizedHtml}

  <footer class="standalone-footer-notice">
    <span>Site hébergé via <strong>html.pinou007.fr</strong></span>
    <span>— Attention : Ne partagez jamais d'informations sensibles (mots de passe, cartes bancaires).</span>
  </footer>

  <script>
    try {
      ${js}
    } catch(err) {
      console.error('Erreur JavaScript :', err);
    }
  </script>
</body>
</html>`;
}
