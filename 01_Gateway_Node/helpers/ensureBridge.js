import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import headerGenerator from "../generators/headerGenerator.js";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_DIR  = path.resolve(__dirname, '../bridge');
const BRIDGE_NODE = path.join(BRIDGE_DIR, 'build/shm_bridge.node');
const CMAKE_ARGS  = [
    'cmake-js', 'compile',
    '--generator', 'Ninja',
    '--CDCmake_CXX_COMPILER=g++',
    '--CDCmake_C_COMPILER=gcc',
    '--preset', 'default'
];

// Returns true if bridge was just compiled (caller should re-exec), false if already existed
export default function ensureBridge() {
    // Always regenerate headers + offsets — cheap and guarantees C++ + JS stay in sync
    headerGenerator();

    if (existsSync(BRIDGE_NODE)) return false;

    console.log('[BRIDGE] shm_bridge.node not found — compiling (this will take some time on first run)...');
    try {
        execSync(`npx ${CMAKE_ARGS.join(' ')}`, {
            cwd: BRIDGE_DIR,
            stdio: 'inherit',
            shell: true
        });
        console.log('[BRIDGE] Compiled successfully please run again.');
        process.exit(0);
    }
    catch (e) {
        console.error('[BRIDGE] Compilation Failed. Fix the error above and try again.');
        process.exit(1);
    }

    return true;
}