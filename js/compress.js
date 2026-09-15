/**
 * compress.js - Moteur de compression et encodage d'état dans l'URL
 * Utilise CompressionStream / DecompressionStream ('deflate-raw')
 * Converti en Base64URL pour une taille minimale dans l'URL
 */

// Convertit un Uint8Array en chaîne Base64URL (compatible URL sans échappement)
export function bytesToBase64Url(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convertit une chaîne Base64URL en Uint8Array
export function base64UrlToBytes(base64Url) {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compresse une chaîne UTF-8 avec Deflate-raw
 */
export async function compressString(str) {
  if (!str) return '';
  if (typeof CompressionStream === 'undefined') {
    return encodeURIComponent(str);
  }
  try {
    const stream = new Blob([new TextEncoder().encode(str)]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(compressedStream).arrayBuffer();
    return bytesToBase64Url(new Uint8Array(buffer));
  } catch (err) {
    console.error('Erreur de compression:', err);
    return encodeURIComponent(str);
  }
}

/**
 * Décompresse une chaîne Base64URL avec Deflate-raw
 */
export async function decompressString(compressedBase64Url) {
  if (!compressedBase64Url) return '';
  if (typeof DecompressionStream === 'undefined') {
    return decodeURIComponent(compressedBase64Url);
  }
  try {
    const bytes = base64UrlToBytes(compressedBase64Url);
    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
    const buffer = await new Response(decompressedStream).arrayBuffer();
    return new TextDecoder().decode(buffer);
  } catch (err) {
    try {
      return decodeURIComponent(compressedBase64Url);
    } catch {
      console.error('Erreur de décompression:', err);
      return '';
    }
  }
}

/**
 * Encode le payload complet { html, css, js } en chaîne compressée
 */
export async function encodePayload({ html = '', css = '', js = '' }) {
  // Structure compacte en tableau JSON [html, css, js]
  const rawJson = JSON.stringify([html, css, js]);
  const compressed = await compressString(rawJson);
  return {
    compressed,
    rawLength: new TextEncoder().encode(rawJson).length,
    compressedLength: compressed.length
  };
}

/**
 * Décode le payload complet depuis la chaîne compressée
 */
export async function decodePayload(compressedString) {
  if (!compressedString) {
    return { html: '', css: '', js: '' };
  }
  try {
    const rawJson = await decompressString(compressedString);
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      return {
        html: parsed[0] || '',
        css: parsed[1] || '',
        js: parsed[2] || ''
      };
    }
    return { html: '', css: '', js: '' };
  } catch (err) {
    console.warn('Impossible de décoder le payload compressé:', err);
    return { html: '', css: '', js: '' };
  }
}

/**
 * Calcule les statistiques de taille et de limite d'URL
 */
export function calculateUrlStats(urlLength, rawBytes = 0, compressedBytes = 0) {
  const SAFE_LIMIT = 2048;
  const MAX_LIMIT = 4096;
  const percentage = Math.min(100, Math.round((urlLength / SAFE_LIMIT) * 100));
  
  let status = 'safe'; // 'safe', 'warning', 'danger'
  if (urlLength > MAX_LIMIT) {
    status = 'danger';
  } else if (urlLength > SAFE_LIMIT) {
    status = 'warning';
  }

  const savings = rawBytes > 0 
    ? Math.max(0, Math.round((1 - (compressedBytes / rawBytes)) * 100)) 
    : 0;

  return {
    urlLength,
    safeLimit: SAFE_LIMIT,
    maxLimit: MAX_LIMIT,
    percentage,
    status,
    rawBytes,
    compressedBytes,
    savings
  };
}
