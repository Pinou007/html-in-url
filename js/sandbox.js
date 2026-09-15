/**
 * sandbox.js - Sandbox iframe sécurisée et étanche
 * 100% exécuté côté client dans le navigateur (parfait pour GitHub Pages)
 * - Aucune iframe imbriquée (CSP frame-src 'none')
 * - Aucune redirection ni window.open
 * - Pas de allow-same-origin (isolation totale)
 * - Console relayée par postMessage vers l'onglet Console
 */

export function buildSandboxDocument({ html = '', css = '', js = '' }) {
  const securityScript = `
    <script>
      (function() {
        const block = function(action) {
          console.warn('[Sandbox Sécurité] Bloqué :', action);
          return false;
        };

        window.open = function(url) { return block('window.open(' + (url || '') + ')'); };

        try {
          window.location.assign = block;
          window.location.replace = block;
          Object.defineProperty(window.location, 'href', {
            set: function(val) { block('location.href = ' + val); },
            get: function() { return 'about:blank'; }
          });
        } catch(e) {}

        // Bloquer tous les liens externes
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a');
          if (a) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Sandbox Sécurité] Navigation par lien bloquée :', a.getAttribute('href') || '#');
          }
        }, true);

        // Bloquer les formulaires externes
        document.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('[Sandbox Sécurité] Envoi de formulaire bloqué.');
        }, true);

        // Empêcher la création d'iframes dynamiques
        const origCreate = document.createElement.bind(document);
        document.createElement = function(tag, opts) {
          if (typeof tag === 'string' && (tag.toLowerCase() === 'iframe' || tag.toLowerCase() === 'frame' || tag.toLowerCase() === 'embed')) {
            console.warn('[Sandbox Sécurité] Création d\\'iframe bloquée.');
            return origCreate('div');
          }
          return origCreate(tag, opts);
        };

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

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="frame-src 'none'; child-src 'none'; object-src 'none';">
  <!-- Police Nunito -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
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
    ${css}
  </style>
</head>
<body>
  ${html}

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

export function buildStandaloneExport({ html = '', css = '', js = '', title = 'Projet HTML in URL' }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Nunito', system-ui, sans-serif;
      margin: 0;
      padding: 1rem;
      line-height: 1.5;
    }
    ${css}
  </style>
</head>
<body>
  ${html}

  <script>
    ${js}
  </script>
</body>
</html>`;
}
