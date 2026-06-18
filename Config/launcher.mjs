import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NODE_CMD = process.execPath;
const NODE_ARGS = ['--experimental-vm-modules', path.resolve('01_Gateway_Node/index.js')];
const CPP_EXE = path.resolve('03_Core_Cpp/out/build/debug/main.exe');
const PY_SRC = path.resolve('02_Strategies_Python/example.py');

const procs = [];
let stop = false;

function Launch(label, cmd, args, { ignoreCleanExit = false } = {}) {
    console.log(`[LAUNCHER] Starting....`);
    const p = spawn(cmd, args, {stdio: 'inherit', shell: false});

    p.on('exit', (code) => {
        console.log(`[LAUNCHER] ${label} exited (code ${code})`);
        if (ignoreCleanExit && code === 0) return;
        if (!stop) stopAll();
    });
    procs.push({label, p});
    return p;
}

function stopAll() {
    if (stop) return;
    stop = true;
    console.log('\n[LAUNCHER] Shutting down all processes...');
    for (const { label, p } of procs) {
        console.log(`[LAUNCHER] Shutting down ${label}`);
        p.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 2000);
}

// ── Launch sequence ───────────────────────────────────────────────────────────
Launch('Node Gateway', NODE_CMD, NODE_ARGS);
console.log('[LAUNCHER] Waiting 3s for Node to create SHM...');
await new Promise(r => setTimeout(r, 3000))

Launch('C++ Core', CPP_EXE, []);
Launch('Python', 'python', [PY_SRC], {ignoreCleanExit: true});

// ── Ctrl+C handler ────────────────────────────────────────────────────────────
process.on('SIGINT',  stopAll);
process.on('SIGTERM', stopAll);

console.log('[LAUNCHER] All process running.\nPress Ctrl+C to stop');