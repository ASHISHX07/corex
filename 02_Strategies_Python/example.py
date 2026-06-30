import signal, sys
import time
from shm import ShmReader

# Wait for Gateway Node to be ready
print("Waiting for Gateway Node...")
while not reader.is_ready():
    time.sleep(0.1)
print('Connected!')

# ── Read live index data ──────────────────────────────────────────────────────
index = reader.get_index(0)
print(f"Index : {index.symbol}")
print(f"LTP   : {index.ltp}")
print(f"VIX   : {index.iVixLtp}")
print(f"CallOI: {index.tCallOi}")
print(f"PutOI : {index.tPutOi}\n")

# ── Read full option chain ────────────────────────────────────────────────────
calls = reader.get_calls()
puts  = reader.get_puts()

print(f"Active Calls: {len(calls)}, Active Puts: {len(puts)}\n")

# ── Example ───────────────────────────────────────────────────────────────────
for opt in calls[:3]:
    print(f"  {opt.symbol:30s} | Strike: {opt.strike:6d} | LTP: {opt.ltp:8.2f} | IV: {opt.iv:.4f}")

def handle(sig, frame):
    sys.exit(0)

x = "Hello there from python side"
print(x)

signal.signal(signal.SIGINT, handle)
signal.signal(signal.SIGTERM, handle)