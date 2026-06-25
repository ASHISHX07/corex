## Prerequisites
1. Node.js 20+
2. CMake 3.20+
3. Boost (with interprocess) — must be on system PATH / findable by CMake
   - Windows: `vcpkg install boost-interprocess` then set VCPKG_ROOT
   - Linux: `sudo apt install libboost-all-dev`

## First-time setup
1. Copy `.env.example` → `.env` and fill in your FYERS_APP_ID, FYERS_SECRET_ID, FYERS_REDIRECT_URL
2. Run CMake configure + build (see CMakeUserPresets.example.json) → copy to CMakeUserPresets.json
3. `node Config/launcher.mjs`