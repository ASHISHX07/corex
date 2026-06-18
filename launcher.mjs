#!/usr/bin/env node
// launcher.mjs — single cross-platform launcher (Windows + Linux/Mac)
// Usage: node launcher.mjs
// Ctrl+C → graceful shutdown (Node cleans SHM, then all processes exit)

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === 'win32';

const STOP_FLAG   = path.resolve(__dirname, 'Data/stop.flag');
const LOGS_DIR    = path.resolve(__dirname, 'Data/systemLogs');
const GRACE_MS    = 4000; // ms to wait for graceful exit before force-kill

// ── Ensure dirs exist ────────────────────────────────────────────────────────
fs.mkdirSync(LOGS_DIR, { recursive: true });
// Remove any leftover stop flag from a previous run
if (fs.existsSync(STOP_FLAG)) fs.unlinkSync(STOP_FLAG);

// ── Process definitions ───────────────────────────────────────────────────────
const PROCESSES = [
  {
    name: 'NODE',
    cmd:  isWindows ? 'node' : 'node',
    args: ['--experimental-vm-modules', '01_Gateway_Node/index.js'],
    log:  path.join(LOGS_DIR, 'node.log'),
    delay: 0,
  },
  {
    name: 'CORE',
    cmd:  isWindows
            ? '03_Core_Cpp\\out\\build\\debug\\main.exe'
            : '03_Core_Cpp/out/build/debug/main',
    args: [],
    log:  path.join(LOGS_DIR, 'core.log'),
    delay: 3000, // wait for Node/SHM to be ready
  },
  {
    name: 'PYTHON',
    cmd:  isWindows ? 'python' : 'python3',
    args: ['02_Strategies_Python/example.py'],
    log:  path.join(LOGS_DIR, 'python.log'),
    delay: 3500,
  },
];

// ── Spawn helpers ─────────────────────────────────────────────────────────────
const procs = new Map(); // name → ChildProcess

function prefix(name) {
  const pad = 6;
  return `[${name.padEnd(pad)}]`;
}

function pipeOutput(child, name, logFile) {
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const tag = prefix(name);

  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) continue;
    stream.on('data', (chunk) => {
      const lines = chunk.toString().replace(/\r\n/g, '\n').trimEnd();
      for (const line of lines.split('\n')) {
        const out = `${tag} ${line}`;
        console.log(out);
        logStream.write(out + '\n');
      }
    });
  }
}

function spawnProcess({ name, cmd, args, log, delay }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`${prefix('LAUNCH')} Starting ${name}...`);
      const child = spawn(cmd, args, {
        cwd: __dirname,
        shell: isWindows, // needed on Windows for .exe resolution
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      pipeOutput(child, name, log);

      child.on('error', (err) => {
        console.error(`${prefix(name)} Failed to start: ${err.message}`);
      });

      child.on('exit', (code, signal) => {
        procs.delete(name);
        if (!shuttingDown) {
          console.log(`${prefix(name)} Exited (code=${code ?? signal}). Triggering shutdown.`);
          gracefulShutdown();
        }
      });

      procs.set(name, child);
      resolve();
    }, delay);
  });
}

// ── Shutdown ──────────────────────────────────────────────────────────────────
let shuttingDown = false;

async function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${prefix('LAUNCH')} Ctrl+C received — shutting down gracefully...`);

  // 1. Write stop flag → Node picks it up, sets systemStatus=0, closes SHM, exits
  fs.writeFileSync(STOP_FLAG, 'stop');
  console.log(`${prefix('LAUNCH')} Stop flag written. Waiting ${GRACE_MS / 1000}s for clean exit...`);

  // 2. Wait for graceful period
  await new Promise((r) => setTimeout(r, GRACE_MS));

  // 3. Force-kill anything still alive
  for (const [name, child] of procs) {
    if (!child.exitCode !== null) {
      console.log(`${prefix('LAUNCH')} Force-killing ${name}...`);
      child.kill('SIGKILL');
    }
  }

  // 4. Clean up stop flag if Node didn't
  if (fs.existsSync(STOP_FLAG)) fs.unlinkSync(STOP_FLAG);

  console.log(`${prefix('LAUNCH')} All processes stopped.`);
  process.exit(0);
}

process.on('SIGINT',  gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ── Launch all ────────────────────────────────────────────────────────────────
console.log(`${prefix('LAUNCH')} CoreX starting (${isWindows ? 'Windows' : 'Linux/Mac'})`);
console.log(`${prefix('LAUNCH')} Logs → ${LOGS_DIR}`);
console.log(`${prefix('LAUNCH')} Press Ctrl+C to stop all processes gracefully.\n`);

for (const def of PROCESSES) {
  await spawnProcess(def);
}
