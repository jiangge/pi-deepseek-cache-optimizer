import { __internals_for_tests as internals } from "#extension";

function check(condition: boolean, label: string): void {
  if (!condition) throw new Error(`verification invariant failed: ${label}`);
}

const toolFixture = {
  model: "fixture-model",
  tools: [
    { type: "function", function: { name: "zeta", parameters: { type: "object" } } },
    { type: "function", function: { name: "alpha", parameters: { type: "object" } } },
  ],
  tool_choice: { type: "function", function: { name: "zeta" } },
};
const toolResult = internals.normalizeToolsInPayload(toolFixture, "openai-completions");
const sortedToolFixture = toolResult.payload as typeof toolFixture;
check(toolResult.changed === true, "OpenAI tool order changed");
check(toolFixture.tools.map((tool) => tool.function.name).join(",") === "zeta,alpha", "OpenAI caller payload unchanged");
check(sortedToolFixture.tools.map((tool) => tool.function.name).join(",") === "alpha,zeta", "OpenAI sorted payload order");
check(sortedToolFixture.tools[0] === toolFixture.tools[1], "OpenAI tool object identity preserved");
check(sortedToolFixture.tool_choice === toolFixture.tool_choice, "OpenAI tool choice identity preserved");

const signal = new AbortController().signal;
const googleFixture = {
  model: "fixture-gemini",
  contents: [],
  config: {
    tools: [{ functionDeclarations: [
      { name: "zeta", parametersJsonSchema: { type: "object" } },
      { name: "alpha", parametersJsonSchema: { type: "object" } },
    ] }],
    abortSignal: signal,
  },
};
const googleResult = internals.normalizeToolsInPayload(googleFixture, "google-generative-ai");
const sortedGoogleFixture = googleResult.payload as typeof googleFixture;
check(googleResult.changed === true, "Google tool order changed");
check(sortedGoogleFixture.config.tools[0].functionDeclarations[0] === googleFixture.config.tools[0].functionDeclarations[1], "Google tool object identity preserved");
check(sortedGoogleFixture.config.abortSignal === signal, "Google AbortSignal identity preserved");

const markedToolFixture = {
  tools: [
    { type: "function", function: { name: "zeta", parameters: { type: "object" } } },
    { type: "function", function: { name: "alpha", parameters: { type: "object" } }, cache_control: { type: "ephemeral" } },
  ],
};
const markedResult = internals.normalizeToolsInPayload(markedToolFixture, "openai-completions");
check(markedResult.changed === false, "cache marker ordering preserved");
check(markedResult.payload === markedToolFixture, "cache-marked payload identity preserved");

const unknownFixture = { tools: toolFixture.tools };
const unknownResult = internals.normalizeToolsInPayload(unknownFixture, "custom-api");
check(unknownResult.changed === false && unknownResult.payload === unknownFixture, "custom API no-op");

console.log(JSON.stringify({
  experiment: "deterministic-tool-ordering",
  fixtureScope: "local deterministic fixtures; no Pi session or provider was contacted",
  verifiedPayloads: 2,
  toolOrderChanges: Number(toolResult.changed) + Number(googleResult.changed),
  callerPayloadMutations: 0,
  toolIdentityPreserved: true,
  abortSignalIdentityPreserved: sortedGoogleFixture.config.abortSignal === signal,
  cacheMarkerPayloadChanges: Number(markedResult.changed),
  unknownPayloadChanges: Number(unknownResult.changed),
  providerCacheUsageMeasurement: "unavailable: fixture-only run; no synthetic cache hits claimed",
}, null, 2));
