import signal, sys

def handle(sig, frame):
    sys.exit(0)

x = "Hello there from python side"
print(x)

signal.signal(signal.SIGINT, handle)
signal.signal(signal.SIGTERM, handle)