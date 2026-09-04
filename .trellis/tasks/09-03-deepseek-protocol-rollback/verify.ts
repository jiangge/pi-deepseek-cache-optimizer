import { __internals_for_tests as internals } from "#extension";

function check(condition: boolean, label: string): void {
  if (!condition) throw new Error(`verification invariant failed: ${label}`);
}

function model(compat: Record<string, unknown> = {}) {
  return {
    provider: "amd-radeon",
    id: "DeepSeek-V4-Flash",
    name: "DeepSeek V4 Flash",
    api: "openai-completions",
    baseUrl: "https://developer.amd.com.cn/radeon/api/v1",
    compat,
  } as any;
}

const generic = model({ supportsReasoningEffort: true });
check(!internals.isDeepSeekWireCompatApplicable(generic), "model name does not prove DeepSeek wire format");
check(internals.describeMissingDeepSeekCompat(generic).length === 0, "generic model has no DeepSeek replay warning");
check(
  JSON.stringify(internals.buildFixSuggestion(generic)).includes("sendSessionAffinityHeaders"),
  "generic proxy guidance remains available",
);
check(!JSON.stringify(internals.buildFixSuggestion(generic)).includes("thinkingFormat"), "ordinary fix does not invent thinkingFormat");

for (const format of ["openai", "qwen", "openrouter", "together"]) {
  const current = model({ thinkingFormat: format, supportsReasoningEffort: true });
  check(!internals.isDeepSeekWireCompatApplicable(current), `${format} remains non-DeepSeek protocol advice`);
  check(!JSON.stringify(internals.buildFixSuggestion(current)).includes("requiresReasoningContent"), `${format} has no replay advice`);
}

const explicitDeepSeek = model({ thinkingFormat: "deepseek", supportsReasoningEffort: true });
check(internals.isDeepSeekWireCompatApplicable(explicitDeepSeek), "explicit DeepSeek format enables replay diagnostics");
check(
  internals.describeMissingDeepSeekCompat(explicitDeepSeek).join(",") === "requiresReasoningContentOnAssistantMessages",
  "explicit DeepSeek format reports only replay compat",
);
check(!JSON.stringify(internals.buildFixSuggestion(explicitDeepSeek)).includes('"thinkingFormat"'), "ordinary DeepSeek fix does not add a protocol selector");

const evidence = internals.hasReasoningProtocolRejectionText(
  "400 Unsupported parameter: thinking. Use reasoning_effort instead.",
);
check(evidence, "directional reasoning rejection evidence is recognized");
check(!internals.hasReasoningProtocolRejectionText("400 Unsupported parameter: reasoning_effort. Use thinking instead."), "reverse direction is ignored");
check(!internals.hasReasoningProtocolRejectionText("Unsupported parameter: thinking; retry later."), "incomplete evidence is ignored");
check(
  internals.buildReasoningProtocolFixSuggestion(generic, true)?.compatKeys.thinkingFormat === "openai",
  "evidence-driven protocol repair is explicit and model-scoped",
);

const original = `{
  "providers": {
    "proxy": {
      "apiKey": "env:DO_NOT_PERSIST",
      "models": [{ "id": "deepseek-v4", "compat": { "sendSessionAffinityHeaders": false } }]
    }
  }
}`;
const fixed = original.replace('"sendSessionAffinityHeaders": false', '"sendSessionAffinityHeaders": true');
const receipt = internals.createModelsJsonFixReceipt(
  original,
  fixed,
  "proxy",
  "deepseek-v4",
  "model",
  { sendSessionAffinityHeaders: true },
  true,
  "/tmp/models.json.backup-cache-optimizer-verifier",
  1_700_000_000_000,
);
check(!!receipt, "privacy-safe receipt can be created for a scalar fix");
check(!JSON.stringify(receipt).includes("DO_NOT_PERSIST"), "receipt excludes credentials");
check(!JSON.stringify(receipt).includes("prompt"), "receipt excludes prompt fields");
check(!JSON.stringify(receipt).includes("payload"), "receipt excludes payload fields");

const later = fixed.replace('"sendSessionAffinityHeaders": true', '"sendSessionAffinityHeaders": true, "later": "keep"');
const surgical = internals.composeModelsJsonReceiptRollback(later, receipt);
check(!("error" in surgical), "changed file permits guarded surgical rollback");
if (!("error" in surgical)) {
  check(surgical.modifiedText.includes('"sendSessionAffinityHeaders": false'), "surgical rollback restores owned scalar");
  check(surgical.modifiedText.includes('"later": "keep"'), "surgical rollback preserves later user change");
}

console.log(JSON.stringify({
  experiment: "deepseek-protocol-safe-rollback",
  fixtureScope: "local deterministic fixtures; no Pi session or provider was contacted",
  protocolCases: 6,
  genericProtocolInferences: 0,
  directionalRejectionEvidence: Number(evidence),
  receiptSensitiveFields: 0,
  surgicalRollbackPreservedUserChange: true,
  providerCacheUsageMeasurement: "unavailable: fixture-only run; no synthetic cache hits claimed",
}, null, 2));
