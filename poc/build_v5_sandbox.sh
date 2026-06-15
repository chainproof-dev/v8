#!/bin/bash
# ==============================================================================
# V8 v5 Sandbox Escape Build Script
# Issue 478814654 - BigInt NormalizeAndRecombine OOB Write
# ==============================================================================
#
# This script builds V8 with the v5 instrumentation patch that demonstrates
# the sandbox escape via the NormalizeAndRecombine carry OOB write.
#
# The v5 patch uses:
#   1. CopyAndZeroExtend corruption (original report technique)
#   2. new digit_t[] allocator for BigInt scratch buffers
#
# With ASAN + --sandbox-testing, the OOB write into ASAN redzones is
# detected and reported as "## V8 sandbox violation detected!"
#
# Prerequisites:
#   - depot_tools in PATH
#   - git, curl, Python 3
#   - ~20GB free disk space
#   - ~8GB RAM (16GB recommended)
#
# Usage:
#   chmod +x build_v5_sandbox.sh
#   ./build_v5_sandbox.sh
#
# After building, run:
#   ./out/asan-sandbox/d8 --sandbox-testing poc/poc_sandbox_violation_v5.js
#
# Expected output:
#   ## V8 sandbox violation detected!
# ==============================================================================

set -e

V8_DIR="${HOME}/v8-v5-build"
REPO_URL="https://github.com/chainproof-dev/v8.git"
BRANCH="main"
OUT_DIR="out/asan-sandbox"

echo "============================================"
echo "V8 v5 Sandbox Escape Build Script"
echo "Issue 478814654"
echo "============================================"

# Step 1: Fetch V8 source
echo ""
echo "[1/6] Fetching V8 source..."
if [ -d "${V8_DIR}" ]; then
    echo "  Directory ${V8_DIR} already exists. Pulling latest..."
    cd "${V8_DIR}"
    git fetch origin
    git checkout ${BRANCH}
    git pull origin ${BRANCH}
else
    echo "  Cloning from ${REPO_URL}..."
    mkdir -p "${V8_DIR}"
    cd "${V8_DIR}"
    git clone ${REPO_URL} .
    git checkout ${BRANCH}
fi

# Step 2: Sync dependencies
echo ""
echo "[2/6] Syncing dependencies (this may take a while)..."
gclient sync --no-history -j$(nproc)

# Step 3: Create output directory and args.gn
echo ""
echo "[3/6] Creating build configuration..."
mkdir -p "${OUT_DIR}"
cat > "${OUT_DIR}/args.gn" << 'EOF'
is_debug = false
dcheck_always_on = false
is_asan = true
target_cpu = "x64"

v8_enable_sandbox = true
v8_enable_memory_corruption_api = true
v8_advanced_bigint_algorithms = true

is_clang = true
use_custom_libcxx = true

symbol_level = 1
treat_warnings_as_errors = false
EOF

echo "  Build args written to ${OUT_DIR}/args.gn:"
cat "${OUT_DIR}/args.gn"

# Step 4: Generate build files
echo ""
echo "[4/6] Generating build files..."
gn gen "${OUT_DIR}"

# Step 5: Build d8
echo ""
echo "[5/6] Building d8 (this will take a while)..."
ninja -C "${OUT_DIR}" d8 -j$(nproc)

# Step 6: Copy PoC files
echo ""
echo "[6/6] Setting up PoC files..."
if [ -d "poc" ]; then
    echo "  PoC directory already exists."
else
    echo "  PoC directory found in repo."
fi

# Verify the build
echo ""
echo "============================================"
echo "Build Complete!"
echo "============================================"
echo ""
echo "V8 binary: ${V8_DIR}/${OUT_DIR}/d8"
echo ""
echo "PoC files:"
ls -la poc/poc_sandbox_violation*.js 2>/dev/null || echo "  No PoC files found"
echo ""
echo "To test sandbox escape, run:"
echo "  cd ${V8_DIR}"
echo "  ./out/asan-sandbox/d8 --sandbox-testing poc/poc_sandbox_violation_v5.js"
echo ""
echo "Expected output:"
echo "  ## V8 sandbox violation detected!"
echo ""
echo "If you see 'Caught harmless memory access violation (safe region)',"
echo "this means the v5 BigIntPlatform patch (new digit_t[] allocator)"
echo "is not being used. Check src/execution/isolate.cc for the patch."
