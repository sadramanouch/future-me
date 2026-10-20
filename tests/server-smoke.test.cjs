const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { randomBytes } = require('node:crypto');
const net = require('node:net');

const serverDir = resolve(__dirname, '../server');

test('server refuses a missing signing secret', () => {
  const result = spawnSync(process.execPath, ['index.js'], {
    cwd: serverDir, env: { PATH: process.env.PATH, NODE_ENV: 'test' }, encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Set JWT_SECRET/);
});

test('isolated server exposes health and keeps unconfigured billing unavailable', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'future-me-smoke-'));
  const reservation = net.createServer();
  await new Promise((done) => reservation.listen(0, '127.0.0.1', done));
  const port = reservation.address().port;
  await new Promise((done) => reservation.close(done));
  const child = spawn(process.execPath, ['index.js'], {
    cwd: serverDir,
    env: { PATH: process.env.PATH, NODE_ENV: 'test', PORT: String(port),
      HOST: '127.0.0.1', DATA_DIR: directory, JWT_SECRET: randomBytes(32).toString('hex') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  t.after(async () => {
    if (child.exitCode === null) {
      const stopped = new Promise((done) => child.once('exit', done));
      child.kill('SIGTERM');
      await stopped;
    }
    rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}/api`;
  let health;
  for (let tries = 0; tries < 100; tries++) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${output}`);
    try { health = await fetch(`${base}/health`); if (health.ok) break; } catch {}
    await new Promise((done) => setTimeout(done, 50));
  }
  assert.equal(health?.status, 200, output);
  assert.equal((await health.json()).status, 'ok');
  assert.equal((await fetch(`${base}/auth/verify`)).status, 401);
  const webhook = await fetch(`${base}/payment/webhook`, { method: 'POST' });
  assert.equal(webhook.status, 503);
  assert.match((await webhook.json()).error, /not configured/);
});
