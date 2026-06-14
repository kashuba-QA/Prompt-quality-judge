// Prompt Quality Judge — Unified Proxy
// Handles: Admin API + OpenAI + Gemini + Grok
// Environment Variables:
//   ADMIN_EMAIL         = tutboss@net.com
//   ADMIN_PASSWORD      = your_admin_password
//   API_BASE            = https://api.get-harder.today
//   ALLOWED_ORIGIN      = *
//   OPENAI_KEY          = sk-proj-...
//   GEMINI_KEY          = AIza...
//   GROK_KEY            = xai-... (optional)

import https from 'https';
import http from 'http';

const API_BASE      = process.env.API_BASE      || 'https://api.get-harder.today';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const OPENAI_KEY    = process.env.OPENAI_KEY    || '';
const GEMINI_KEY    = process.env.GEMINI_KEY    || '';
const GROK_KEY      = process.env.GROK_KEY      || '';

let cachedToken = null;
let tokenExpiry = 0;

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getAdminToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const body = JSON.stringify({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  });
  const result = await fetchJson(`${API_BASE}/api/Authenticate/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body
  });
  if (!result.body.accessToken) throw new Error('Admin login failed');
  cachedToken = result.body.accessToken;
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const path = event.rawPath || '/';
  const queryString = event.rawQueryString ? `?${event.rawQueryString}` : '';
  const bodyStr = event.body
    ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body)
    : null;

  try {
    // ── OpenAI proxy ──────────────────────────────────────────────────
    if (path === '/proxy/openai') {
      const result = await fetchJson('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'Content-Length': Buffer.byteLength(bodyStr || '')
        },
        body: bodyStr
      });
      return {
        statusCode: result.status,
        headers: CORS_HEADERS,
        body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
      };
    }

    // ── Gemini proxy ──────────────────────────────────────────────────
    if (path.startsWith('/proxy/gemini')) {
      const geminiModel = event.queryStringParameters?.model || 'gemini-3.5-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_KEY}`;
      const result = await fetchJson(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr || '')
        },
        body: bodyStr
      });
      return {
        statusCode: result.status,
        headers: CORS_HEADERS,
        body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
      };
    }

    // ── Grok proxy ────────────────────────────────────────────────────
    if (path === '/proxy/grok') {
      const result = await fetchJson('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_KEY}`,
          'Content-Length': Buffer.byteLength(bodyStr || '')
        },
        body: bodyStr
      });
      return {
        statusCode: result.status,
        headers: CORS_HEADERS,
        body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
      };
    }

    // ── Admin API proxy ───────────────────────────────────────────────
    const adminToken = await getAdminToken();
    const targetUrl = `${API_BASE}${path}${queryString}`;
    const reqOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    };
    if (bodyStr) {
      reqOptions.body = bodyStr;
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const result = await fetchJson(targetUrl, reqOptions);
    return {
      statusCode: result.status,
      headers: CORS_HEADERS,
      body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
