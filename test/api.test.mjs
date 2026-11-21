import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import {
  checkBackendStatus, getApiBaseUrl, scanCombinedApi,
  scanMessageApi, scanUrlApi, setApiMode
} from '../src/services/api.js';
import { getScanHistory, getScanStats, saveCompletedScan, saveScan } from '../src/utils/storage.js';

const otpMessage = 'Reply with your OTP';
const targetUrl = 'https://bit.ly/stage-one-example';
const otpAnalysis = {
  verdict: 'HIGH_RISK',
  score: 75,
  link_only: false,
  notice: null,
  highlighted_phrases: [otpMessage],
  extracted_urls: [],
  unrolled_urls: [],
  signals: [{ label: 'Request for a secret', weight: 75 }],
  reason: 'The message asks for an OTP or payment PIN.',
  action: 'Keep your OTP or PIN private. Verify through the original app.',
  safety_tip: 'For suspected fraudulent calls, SMS or WhatsApp messages in India, use Chakshu. If you have lost money to cyber fraud, call 1930 immediately.'
};
const urlAnalysis = {
  ...otpAnalysis,
  verdict: 'SUSPICIOUS',
  score: 20,
  link_only: true,
  notice: 'Only the link was checked.',
  highlighted_phrases: [targetUrl],
  extracted_urls: [targetUrl],
  unrolled_urls: ['https://example.com/destination'],
  signals: [{ label: 'Shortened link', weight: 20 }],
  reason: 'The provider returned a redirect address. Further redirects were not checked.',
  action: "Check through the organization's official app or a known contact."
};
const safeAnalysis = {
  ...otpAnalysis,
  verdict: 'SAFE',
  score: 0,
  highlighted_phrases: [],
  signals: [],
  reason: 'No obvious warning signs found by these checks. Sender identity is unverified.',
  action: 'Verify unexpected requests independently before acting.'
};

beforeEach(() => setApiMode('AUTO'));

function mockAnalysis(t, content, analysis) {
  return t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, `${getApiBaseUrl()}/api/analyze`);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { content });
    return Response.json(analysis);
  });
}

function mockHistory(t) {
  const entries = new Map();
  const storage = {
    getItem: key => entries.get(key) ?? null,
    setItem: t.mock.fn((key, value) => entries.set(key, value))
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  return storage;
}

test('live message maps the real OTP verdict and all eleven response fields', async t => {
  setApiMode('LIVE');
  const fetch = mockAnalysis(t, otpMessage, otpAnalysis);
  const result = await scanMessageApi(otpMessage, { explanationLang: 'kn' });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(result.verdict, 'HIGH_RISK');
  assert.equal(result.classification, 'DANGEROUS');
  assert.equal(result.riskScore, 75);
  assert.equal(result.isLive, true);
  assert.equal(result.source, 'FASTAPI_ANALYZE');
  assert.deepEqual(result.indicators.suspiciousPhrases, otpAnalysis.highlighted_phrases);
  assert.equal(result.explanation, otpAnalysis.reason);
  assert.equal(result.recommendation, otpAnalysis.action);
  for (const [field, value] of Object.entries(otpAnalysis)) {
    assert.deepEqual(result[field], value, field);
  }
});

test('URL posts content and preserves the link-only and redirect evidence', async t => {
  mockAnalysis(t, targetUrl, urlAnalysis);
  const result = await scanUrlApi(targetUrl);
  assert.equal(result.type, 'url');
  assert.equal(result.classification, 'SUSPICIOUS');
  assert.equal(result.riskScore, 20);
  assert.equal(result.link_only, true);
  assert.equal(result.notice, urlAnalysis.notice);
  assert.deepEqual(result.extracted_urls, urlAnalysis.extracted_urls);
  assert.deepEqual(result.unrolled_urls, urlAnalysis.unrolled_urls);
});

test('URL scan rejects a response in which the input was only analyzed as text', async t => {
  mockAnalysis(t, '192.0.2.1', safeAnalysis);
  await assert.rejects(scanUrlApi('192.0.2.1'), /could not analyze this input as a web address/);
});

test('combined scan sends the entire message and URL together', async t => {
  const message = `${otpMessage}\n${'Additional context. '.repeat(10)}`;
  mockAnalysis(t, `${message}\n${targetUrl}`, {
    ...otpAnalysis,
    score: 100,
    highlighted_phrases: [otpMessage, targetUrl],
    extracted_urls: [targetUrl],
    signals: [...otpAnalysis.signals, { label: 'Hidden destination', weight: 25 }]
  });
  const result = await scanCombinedApi(message, targetUrl);
  assert.equal(result.type, 'combined');
  assert.equal(result.target, `${message} | ${targetUrl}`);
  assert.equal(result.riskScore, 100);
  assert.deepEqual(result.extracted_urls, [targetUrl]);
});

test('combined scan accepts a URL alone and rejects empty input', async t => {
  const fetch = mockAnalysis(t, targetUrl, urlAnalysis);
  assert.equal((await scanCombinedApi(' ', targetUrl)).link_only, true);
  await assert.rejects(scanCombinedApi(' ', ' '), /message or a URL/);
  assert.equal(fetch.mock.callCount(), 1);
});

test('a valid backend SAFE response retains its zero score', async t => {
  mockAnalysis(t, 'Hello', safeAnalysis);
  const result = await scanMessageApi('Hello');
  assert.equal(result.classification, 'SAFE');
  assert.equal(result.riskScore, 0);
  assert.equal(result.explanation, safeAnalysis.reason);
});

for (const status of [404, 422, 500]) {
  test(`HTTP ${status} rejects in AUTO and LIVE`, async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
    await assert.rejects(scanMessageApi(otpMessage), new RegExp(`HTTP ${status}`));
    setApiMode('LIVE');
    await assert.rejects(scanMessageApi(otpMessage), new RegExp(`HTTP ${status}`));
  });
}

test('a network failure rejects instead of producing a result', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(scanUrlApi(targetUrl), /Could not connect/);
});

test('a timeout aborts a stalled response body and rejects', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => ({
    ok: true,
    json: () => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      t.mock.timers.tick(4000);
    })
  }));
  await assert.rejects(scanMessageApi(otpMessage), /timed out/);
});

test('HTTP 200 with malformed JSON rejects', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{'));
  await assert.rejects(scanMessageApi(otpMessage), /not valid JSON/);
});

test('a successful HTTP response must contain every backend field', async t => {
  let responseBody;
  t.mock.method(globalThis, 'fetch', async () => Response.json(responseBody));
  for (const field of Object.keys(otpAnalysis)) {
    responseBody = { ...otpAnalysis };
    delete responseBody[field];
    await assert.rejects(scanMessageApi(otpMessage), /invalid result/, field);
  }
});

test('invalid verdicts, invalid scores and malformed evidence reject', async t => {
  let responseBody;
  t.mock.method(globalThis, 'fetch', async () => Response.json(responseBody));
  for (const change of [
    { verdict: 'DANGEROUS' }, { verdict: 'toString' }, { score: '75' },
    { score: -1 }, { score: 101 }, { score: 75.5 }, { score: null },
    { signals: [{ label: 'Broken', weight: '75' }] }, { extracted_urls: [42] }
  ]) {
    responseBody = { ...otpAnalysis, ...change };
    await assert.rejects(scanMessageApi(otpMessage), /invalid result/);
  }
});

test('explicit DEMO uses local scoring and identifies it as simulated', async t => {
  setApiMode('DEMO');
  const fetch = t.mock.method(globalThis, 'fetch');
  for (const result of [
    await scanMessageApi(otpMessage),
    await scanUrlApi(targetUrl),
    await scanCombinedApi(otpMessage, targetUrl)
  ]) {
    assert.equal(result.isLive, false);
    assert.match(result.source, /^DEMO/);
  }
  assert.equal((await checkBackendStatus()).demo, true);
  assert.equal(fetch.mock.callCount(), 0);
});

test('the availability probe validates /api/analyze and never saves to history', async t => {
  const storage = mockHistory(t);
  const fetch = mockAnalysis(t, 'Hello', safeAnalysis);
  assert.deepEqual(await checkBackendStatus(), { online: true, url: getApiBaseUrl() });
  fetch.mock.mockImplementation(async () => Response.json({ status: 'ok' }));
  assert.equal((await checkBackendStatus()).online, false);
  assert.equal(storage.setItem.mock.callCount(), 0);
});

test('scanner history saves a completed result and ignores rejected scans', async t => {
  const storage = mockHistory(t);
  const fetch = mockAnalysis(t, otpMessage, otpAnalysis);
  const completed = await saveCompletedScan(scanMessageApi(otpMessage));
  assert.equal(getScanHistory()[0].id, completed.id);
  assert.equal(getScanHistory()[0].verdict, 'HIGH_RISK');
  const before = getScanHistory();
  const writes = storage.setItem.mock.callCount();

  fetch.mock.mockImplementation(async () => new Response(null, { status: 404 }));
  await assert.rejects(saveCompletedScan(scanMessageApi(otpMessage)), /HTTP 404/);
  await assert.rejects(saveCompletedScan(scanUrlApi(targetUrl)), /HTTP 404/);
  await assert.rejects(saveCompletedScan(scanCombinedApi(otpMessage, targetUrl)), /HTTP 404/);
  fetch.mock.mockImplementation(async () => Response.json({ verdict: 'SAFE' }));
  await assert.rejects(saveCompletedScan(scanMessageApi(otpMessage)), /invalid result/);
  assert.equal(storage.setItem.mock.callCount(), writes);
  assert.deepEqual(getScanHistory(), before);
});

test('result card shows the live score and evidence, labels Demo, and hides legacy default scores', async t => {
  const vite = await createServer({
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, watch: null, ws: false }
  });
  t.after(() => vite.close());
  const { default: RiskResultCard } = await vite.ssrLoadModule('/src/components/RiskResultCard.jsx');
  const renderResult = result => renderToStaticMarkup(createElement(RiskResultCard, { result }));

  const fetch = mockAnalysis(t, otpMessage, otpAnalysis);
  const liveCard = renderResult(await scanMessageApi(otpMessage));
  assert.match(liveCard, /class="score-number">75</);
  assert.match(liveCard, /class="classification-badge DANGEROUS"/);
  for (const text of [
    'FastAPI Live Scan', otpMessage, 'Request for a secret (+75)',
    otpAnalysis.reason, otpAnalysis.action, otpAnalysis.safety_tip
  ]) {
    assert.ok(liveCard.includes(text), text);
  }

  fetch.mock.mockImplementation(async () => Response.json(urlAnalysis));
  const urlCard = renderResult(await scanUrlApi(targetUrl));
  for (const text of [urlAnalysis.notice, ...urlAnalysis.extracted_urls, ...urlAnalysis.unrolled_urls]) {
    assert.ok(urlCard.includes(text), text);
  }

  setApiMode('DEMO');
  const demoCard = renderResult(await scanMessageApi(otpMessage));
  assert.match(demoCard, /Demo Heuristic Engine/);
  assert.doesNotMatch(demoCard, /FastAPI Live Scan/);

  const legacyDefault = { classification: 'SAFE', riskScore: 0, source: 'FASTAPI_LIVE_MODEL' };
  const legacyCard = renderResult(legacyDefault);
  assert.match(legacyCard, /Please run a new scan/);
  assert.doesNotMatch(legacyCard, /score-number|classification-badge SAFE/);
});

test('legacy false-safe and automatic fallback records remain stored without counting as results', t => {
  const storage = mockHistory(t);
  const before = getScanStats();
  const fallback = saveScan({ classification: 'SAFE', riskScore: 0, source: 'DEMO_HEURISTIC_ENGINE', fallbackNotice: 'Backend offline' });
  const legacy = saveScan({ classification: 'SAFE', riskScore: 0, source: 'FASTAPI_LIVE_MODEL' });
  const writes = storage.setItem.mock.callCount();
  assert.deepEqual(getScanStats(), before);
  assert.deepEqual(getScanHistory().slice(0, 2), [legacy, fallback]);
  assert.equal(storage.setItem.mock.callCount(), writes);
});
