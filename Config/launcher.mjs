import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// executables paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cppExe = path.resolve(__dirname, '../03_Core_Cpp/out/build/gcc-ninja/venn_core.exe');
const pySrc = path.resolve(__dirname, '../02_Strategies_Python/example.py');
const nodeGateway = path.resolve(__dirname, '../01_Gateway_Node/index.js');

console.log(`[LAUNCHER] Starting....`);
console.log(`[LAUNCHER] Starting VENN System...`);

// 1. Start Node.js FIRST (The Creator)
console.log(`[LAUNCHER] -----> Launching Node Gateway (Creator)...`);
const nodeProcess = spawn('node', [nodeGateway], { stdio: 'inherit' });
console.log(`[LAUNCHER] -----> Launching Python Layer....`);
const pyProcess = spawn('python', [pySrc], {stdio: 'inherit'});
// 2. Wait 3 seconds for Node to create memory, then start C++
setTimeout(() => {
    console.log(`[LAUNCHER] Launching C++ Core (Worker)...`);
    const cppProcess = spawn(cppExe, [], { stdio: 'inherit' });
    
    // Optional: Launch Python here too
    // const pyProcess = spawn('python', [pySrc], { stdio: 'inherit' });

    // Handle Cleanup
    nodeProcess.on('close', (code) => {
        console.log(`[LAUNCHER] Node exited (${code}). Killing Core...`);
        cppProcess.kill();
        // pyProcess.kill();
        process.exit(code);
    });

}, 3000); // 3 Second Warmup


