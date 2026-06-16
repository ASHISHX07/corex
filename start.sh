#!/bin/bash
# start.sh

# 1. Node side first — it creates SHM segments
node --experimental-vm-modules 01_Gateway_Node/index.js & 
NODE_PID=$!

echo "[LAUNCHER] Waiting for Node SHM..."
until [ -f /dev/shm/CONTROLLER_MEM ] 2>/dev/null; do
    sleep 0.2
done
echo "[LAUNCHER] SHM ready, launching C++ and Python"

# 2. Wait until Node sets systemStatus=1 (or just a fixed delay)
sleep 2

# 3. C++ core
./03_Core_Cpp/out/build/debug/main &
CPP_PID=$!

# 4. Python — was sleeping anyway, launch it now
python3 02_Strategies_Python/example.py &
PY_PID=$!

echo "[LAUNCHER] Node=$NODE_PID C++=$CPP_PID Python=$PY_PID"

# Trap Ctrl+C → kill all three
trap "kill $NODE_PID $CPP_PID $PY_PID 2>/dev/null" SIGINT SIGTERM

wait $NODE_PID
kill $CPP_PID $PY_PID 2>/dev/null