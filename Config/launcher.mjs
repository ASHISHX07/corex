import { spawn } from "child_process";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NODE_CMD  = process.execPath;
const NODE_ARGS = ['--experimental-vm-modules', path.resolve(__dirname, '../01_Gateway_Node/index.js')];
const CPP_EXE   = path.resolve(__dirname, '../03_Core_Cpp/out/build/debug/main.exe');
const PY_SRC    = path.resolve(__dirname, '../02_Strategies_Python/example.py');

const procs = [];
let stopping = false;

function launch(label, cmd, args) {
    console.log(`[LAUNCHER] Starting ${label}...`);
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false });

    p.on('exit', (code) => {
        console.log(`[LAUNCHER] ${label} exited (code ${code})`);
        if (!stopping) stopAll();
    });
    procs.push({ label, p });
    return p;
}

function stopAll() {
    if (stopping) return;
    stopping = true;
    console.log('\n[LAUNCHER] Shutting down all processes...');
    for (const { label, p } of procs) {
        console.log(`[LAUNCHER] SIGTERM -> ${label}`);
        p.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 2000);    // force-exit after 2s if anything hangs
}

// ── Launch sequence ───────────────────────────────────────────────────────────
launch('Node Gateway', NODE_CMD, NODE_ARGS);
console.log('[LAUNCHER] Waiting 3s for Node to create SHM...');
await new Promise(r => setTimeout(r, 3000));

launch('C++ Core', CPP_EXE, []);
launch('Python', 'python', [PY_SRC]);

// ── Ctrl+C handler ────────────────────────────────────────────────────────────
process.on('SIGINT',  stopAll);
process.on('SIGTERM', stopAll);

console.log('[LAUNCHER] All process running.\nPress Ctrl+C to stop');
