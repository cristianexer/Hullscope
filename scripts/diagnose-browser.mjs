import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { cpus, platform, release, arch, totalmem } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';

// Diagnostic only: preserve the suite's bundled Chromium defaults and real rendering.
// No retries, synthetic readiness, GPU overrides or production application changes.
const started = Date.now();
const limit = Math.min(55000, Math.max(30000, Number(process.env.HULLSCOPE_DIAGNOSTIC_TIMEOUT_MS) || 45000));
const external = process.env.HULLSCOPE_DIAGNOSTIC_URL;
const url = external ?? 'http://127.0.0.1:5176/Hullscope/#/vessel/ever-ace';
const directory = resolve('output/playwright/diagnostics', new Date(started).toISOString().replace(/[:.]/g, '-'));
await mkdir(directory, {recursive: true});
const report = {
  startedAt: new Date(started).toISOString(), url, timeoutMs: limit,
  host: {platform: platform(), release: release(), architecture: arch(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem()},
  browserExecutable: chromium.executablePath(), previewOwned: !external,
  status: 'running', stages: [], browserEvents: [], console: [], pageErrors: [], requests: [],
  note: 'Bounds telemetry confirms a viewer frame callback, not independent GPU completion. WebGL probes detached from the scene are distinguished from the rendered canvas.',
};
let preview, browser, page, timeout;
let previewLog = '';
const stage = (name, detail = {}) => {const event = {name, elapsedMs: Date.now() - started, ...detail};report.stages.push(event);console.log(JSON.stringify(event));};
const remaining = (cap) => Math.max(1, Math.min(cap, limit - (Date.now() - started)));
const bounded = (promise, ms) => Promise.race([promise, delay(ms).then(() => {throw new Error(`Operation exceeded ${ms}ms`);})]);
const message = error => error instanceof Error ? `${error.name}: ${error.message}` : String(error);

async function run() {
  if (!external) {
    preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '5176', '--strictPort'], {cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe']});
    preview.stdout.on('data', chunk => {previewLog = (previewLog + chunk.toString()).slice(-16000);});
    preview.stderr.on('data', chunk => {previewLog = (previewLog + chunk.toString()).slice(-16000);});
    preview.on('error', error => {report.previewError = message(error);});
    stage('preview-spawned', {pid: preview.pid});
    let reachable = false;
    for (let i = 0; i < 24; i++) {
      if (preview.exitCode !== null || report.previewError) throw new Error(`Owned preview exited: ${previewLog || report.previewError}`);
      // Vite may style the port separately on CI, splitting the URL with ANSI codes.
      // Keep the raw log as evidence, but match its printable text for ownership.
      try {const response = await fetch(url.split('#')[0], {signal: AbortSignal.timeout(400)});if (response.ok && stripVTControlCharacters(previewLog).includes('http://127.0.0.1:5176/')) {reachable = true;break;}} catch { /* Bounded local startup polling. */ }
      await delay(200);
    }
    if (!reachable) throw new Error('Owned production preview did not become reachable on port 5176.');
    // A port conflict must fail even if another server answered our probe.
    await delay(100);
    if (preview.exitCode !== null) throw new Error(`Owned preview exited: ${previewLog}`);
    stage('preview-ready');
  }
  browser = await chromium.launch({headless: true, timeout: remaining(15000)});
  report.browserVersion = browser.version();stage('browser-launched');
  page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  page.on('console', item => {if (report.console.length < 100) report.console.push({type: item.type(), text: item.text(), elapsedMs: Date.now() - started});});
  page.on('pageerror', error => report.pageErrors.push(message(error)));
  page.on('requestfailed', request => {if (report.requests.length < 100) report.requests.push({url: request.url(), failure: request.failure()?.errorText});});
  page.on('response', response => {if (response.url().includes('/models/') && report.requests.length < 100) report.requests.push({url: response.url(), status: response.status(), elapsedMs: Date.now() - started});});
  await page.exposeFunction('__hullscopeDiagnosticEvent', event => {report.browserEvents.push(event);console.log(JSON.stringify({name: 'browser-event', ...event}));});
  await page.addInitScript(() => {
    const emit = event => {if (typeof window.__hullscopeDiagnosticEvent === 'function') window.__hullscopeDiagnosticEvent(event).catch(() => {});};
    const diagnostics = {contexts: [], mutations: [], startedAt: performance.now()};
    window.__hullscopeDiagnostics = diagnostics;
    const original = HTMLCanvasElement.prototype.getContext;
    const recorded = new WeakSet();
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const context = Reflect.apply(original, this, args);
      if (!String(args[0]).includes('webgl') || recorded.has(this)) return context;
      recorded.add(this);
      const entry = {id: diagnostics.contexts.length, type: args[0], available: Boolean(context), atMs: performance.now(), connectedAtCreation: this.isConnected, sceneAtCreation: Boolean(this.closest('[data-scene-status]')), events: []};
      diagnostics.contexts.push(entry);
      if (context) {
        try {
          const debug = context.getExtension('WEBGL_debug_renderer_info');
          entry.vendor = context.getParameter(context.VENDOR);entry.renderer = context.getParameter(context.RENDERER);
          entry.unmaskedVendor = debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null;
          entry.unmaskedRenderer = debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
          entry.version = context.getParameter(context.VERSION);entry.attributes = context.getContextAttributes();
        } catch (error) {entry.error = String(error);}
      }
      emit({kind: 'webgl-context', ...entry});
      for (const type of ['webglcontextlost', 'webglcontextrestored', 'webglcontextcreationerror']) this.addEventListener(type, event => {const detail = {type, atMs: performance.now(), scene: Boolean(this.closest('[data-scene-status]')), statusMessage: event.statusMessage ?? null};entry.events.push(detail);emit({kind: 'context-event', id: entry.id, ...detail});});
      return context;
    };
    const first = new Set();
    const inspect = mutations => {
      const scene = document.querySelector('[data-scene-status]');
      if (!scene) return;
      const canvas = scene.querySelector('canvas');
      const canvasBounds = canvas?.getBoundingClientRect();
      const rendering = {tier: scene.getAttribute('data-renderer-tier'), lod: scene.getAttribute('data-loaded-lod'), canvasPixels: canvas ? [canvas.width, canvas.height] : null, canvasCss: canvasBounds ? [canvasBounds.width, canvasBounds.height] : null};
      const boundsChanged = mutations.some(mutation => mutation.target === scene && mutation.attributeName === 'data-model-bounds');
      if (boundsChanged && scene.getAttribute('data-loaded') && !first.has('bounds-after-ready')) {
        first.add('bounds-after-ready');const event = {attribute: 'data-model-bounds-after-model-ready', value: scene.getAttribute('data-model-bounds'), atMs: performance.now(), ...rendering};diagnostics.mutations.push(event);emit({kind: 'readiness', ...event});
      }
      for (const attribute of ['data-loaded', 'data-model-bounds']) {
        const value = scene.getAttribute(attribute);
        if (!value || first.has(attribute)) continue;
        first.add(attribute);const event = {attribute, value, atMs: performance.now(), ...rendering};diagnostics.mutations.push(event);emit({kind: 'readiness', ...event});
      }
    };
    new MutationObserver(inspect).observe(document, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-loaded', 'data-model-bounds']});
  });
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: remaining(15000)});stage('document-loaded');
  await page.waitForFunction(() => {
    const scene = document.querySelector('[data-scene-status]');
    const encoded = scene?.getAttribute('data-model-bounds');
    if (!scene?.getAttribute('data-loaded') || !encoded || !window.__hullscopeDiagnostics.mutations.some(event => event.attribute === 'data-model-bounds-after-model-ready')) return false;
    try {const bounds = JSON.parse(encoded);return bounds.length === 4 && bounds.every(Number.isFinite) && bounds[2] > bounds[0] && bounds[3] > bounds[1];} catch {return false;}
  }, undefined, {timeout: remaining(22000)});
  stage('model-and-frame-bounds-ready');report.status = 'ready';
}

try {
  await Promise.race([run(), new Promise((_, reject) => {timeout = setTimeout(() => reject(new Error('Overall diagnostic deadline exceeded')), limit);})]);
} catch (error) {
  report.status = 'failed';report.error = message(error);stage('failure');
} finally {
  clearTimeout(timeout);
  if (page && !page.isClosed()) {
    try {
      report.page = await bounded(page.evaluate(() => ({userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, diagnostics: window.__hullscopeDiagnostics, title: document.title, url: location.href, scene: document.querySelector('[data-scene-status]')?.outerHTML.slice(0, 1000), visibleError: document.querySelector('.scene-error')?.textContent, resourceCount: performance.getEntriesByType('resource').length})), remaining(6000));
    } catch (error) {report.collectionError = message(error);if (report.status === 'ready') report.status = 'partial';}
    // Persist renderer/readiness evidence before a potentially slow GPU screenshot.
    await writeFile(join(directory, 'report.json'), JSON.stringify(report, null, 2));
    stage('renderer-evidence-saved', {output: directory});
    try {await page.screenshot({path: join(directory, 'scene.png'), timeout: remaining(10000)});stage('screenshot-saved');} catch (error) {report.screenshotError = message(error);if (report.status === 'ready') report.status = 'partial';}
  }
  if (browser) try {await bounded(browser.close(), 1500);} catch (error) {report.browserCloseError = message(error);}
  if (preview && preview.exitCode === null) {preview.kill('SIGTERM');await delay(200);if (preview.exitCode === null) preview.kill('SIGKILL');}
  report.previewLog = previewLog;report.elapsedMs = Date.now() - started;report.finishedAt = new Date().toISOString();
  await writeFile(join(directory, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({status: report.status, elapsedMs: report.elapsedMs, output: directory, error: report.error ?? null}, null, 2));
  if (report.status !== 'ready') process.exitCode = 1;
}
