# Conservative deterministic tool ordering

## Goal

Evaluate `@touchtechclub/pi-oc-prompt-cache@0.1.0` and adopt only the deterministic tool-ordering idea that has clear cache-prefix value without weakening pi-cache-optimizer's stability, privacy, prompt-integrity, transport, or request-payload contracts. Do not introduce Context Epoch state, prompt freezing, durable prompt entries, prompt diffs, or update messages. This work must not push or publish artifacts.

## Requirements

* Keep the existing stable-prefix, churn-strip, cache-hints, prompt-rewrite, lifecycle, routing, and provider behavior unchanged.
* Do not add a Context Epoch abstraction, prompt baseline, prompt fingerprint, prompt-freezing hook, epoch lifecycle handlers, or related environment variable.
* Add deterministic tool ordering only through a pure helper and a conservative hook path for verified built-in API payloads.
* Keep tool ordering off by default. Enable it only with a documented truthy `PI_CACHE_OPTIMIZER_TOOL_ORDER` value (`1`, `true`, `yes`, or `on`, case-insensitive).
* Disable tool ordering when optimizer runtime is disabled.
* Custom/unknown transports, malformed tools, missing or blank names, unsupported wrappers, and unsupported shapes must be exact no-ops.
* Sorting must be stable by exact tool name with original index as a tie-breaker and must not use locale-dependent comparison.
* Sorting must not mutate caller input. It must shallow-clone only the changed root/container/tool-array path and preserve tool-object/SDK-object identity, tool schema, tool choice, routing, adapter selection, `AbortSignal`, and request semantics.
* Support only verified built-in OpenAI Completions, Anthropic, Google Generative AI, Google Vertex, and Bedrock Converse request shapes. The pure helper may recognize OpenAI Responses fixtures, but the request hook must preserve the existing Responses/Codex bypass.
* Google/Vertex tools must use Pi's actual `payload.config.tools[].functionDeclarations` nesting.
* Any top-level tool `cache_control` marker on a supported shape must make ordering a no-op. Anthropic `defer_loading` grouping must also make ordering a no-op.
* Do not add Anthropic trailing breakpoints. Existing TTL ordering and cache-control safety remains authoritative.
* Compose sorting with existing Anthropic TTL repair, retention safety, prompt-cache-key fallback, routing, and adapter behavior.
* Add permanent tests for deterministic ordering, exact ties, actual Google/Vertex nesting, `AbortSignal`, identity preservation, unknown/custom/malformed/cache-marked/deferred no-ops, runtime/env gates, Responses bypass, and hook composition.
* Add a reproducible local fixture verifier that reports only structural ordering metrics. It must not print prompts, payloads, headers, session ids, credentials, response bodies, or synthetic provider cache claims.
* Update English/Chinese README and binding hook/state/privacy/quality documentation.
* Do not run `git push`, `npm publish`, or any release operation.

## Acceptance Criteria

* [x] No Context Epoch runtime, environment gate, state, hook behavior, tests, or user-facing feature documentation remains.
* [x] Existing prompt and cache-hints behavior remains unchanged.
* [x] Verified built-in tool payloads are deterministically sorted only when explicitly enabled.
* [x] Custom, unknown, malformed, cache-marked, deferred, already-sorted, and non-tool payloads are untouched.
* [x] Sorting is exact-name/index stable and preserves tool objects, unrelated fields, Google/Vertex `AbortSignal`, and caller input.
* [x] Responses/Codex request-hook bypass and runtime disable remain authoritative.
* [x] Tool ordering composes with existing TTL, retention, cache-key, routing, and adapter behavior.
* [x] Fixture verification is privacy-safe and never claims provider cache hits.
* [x] `npm run typecheck`, `npm test`, `npm run check:diff`, `npm run check:pack`, and task validation pass.
* [x] No commit, push, publish, or release is performed without explicit user approval.

## Definition of Done

* Runtime code, permanent tests, fixture verifier, and synchronized documentation contain only the deterministic tool-order feature.
* A final report records default-off and explicit opt-in test results.
* Existing unrelated dirty files are identified and remain untouched.

## Verification record

- Deep review of the initial combined implementation found that Context Epoch had little practical value for Pi's normal byte-identical prompts and increased prompt/lifecycle/privacy risk.
- Project priority is stability, so Context Epoch was rejected and removed rather than shipped behind a gate.
- Deterministic tool ordering was retained as a default-off, stateless, conservative request transformation.
- `npm run check`: passed (`69` tests, `16` suites, `0` failures; typecheck, diff check, and package dry-run passed).
- Explicit `PI_CACHE_OPTIMIZER_TOOL_ORDER=0` and `=1` full-suite runs both passed (`69/69` each).
- `bun .trellis/tasks/09-03-context-epoch-tool-ordering/verify.ts`: passed; two verified payloads changed order, caller mutations were `0`, tool and `AbortSignal` identity were preserved, and cache-marker/custom payload changes were `0`.
- Provider cache usage was unavailable in the fixture-only verifier and no synthetic hit was claimed.
- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-03-context-epoch-tool-ordering`: passed.
- No commit, push, publish, or release operation was run.

## Technical Approach

1. Keep only the pure tool-shape validator and immutable deterministic ordering helper.
2. Traverse verified provider-specific tool paths, including Pi's actual Google/Vertex nesting.
3. Return the original payload for unsupported, malformed, cache-marked, deferred, or already-sorted inputs.
4. Shallow-clone only changed paths and retain all tool and unrelated runtime object identities.
5. Gate the request hook with `PI_CACHE_OPTIMIZER_TOOL_ORDER` and runtime enablement while preserving Responses/Codex bypasses.
6. Verify hook composition and privacy-safe fixture behavior with permanent tests and the full package checks.

## Decision (ADR-lite)

**Context:** The referenced extension combines prompt epochs, durable prompt material, update messages, generic tool sorting, and trailing cache breakpoints. Review showed deterministic tool ordering can reduce cache-prefix churn, while Context Epoch adds state and prompt-lifecycle complexity for little practical benefit in this project.

**Decision:** Adopt only conservative deterministic tool ordering. Reject Context Epoch entirely. Keep sorting default-off, stateless, allowlisted, immutable, cache-marker-aware, and compatible with existing request mutations.

**Consequences:** The project gains a narrow tool-prefix stability option without introducing prompt baselines or lifecycle state. Benefits are limited to verified built-in payloads; unsupported or order-sensitive shapes remain unchanged. Users must explicitly opt in and can roll back by unsetting the variable and running `/reload`.

## Out of Scope

* Context Epochs, frozen system prompts, prompt fingerprints, prompt diffs, update messages, or durable prompt baselines.
* Generic rewriting of arbitrary custom provider payloads.
* New Anthropic cache breakpoints or changes to TTL semantics.
* Changes to adapter selection, route resolution, compat resolution, stats schema, `/fix`, or provider credentials.
* Provider-specific cache-hit claims without actual returned usage fields.
* Publishing, pushing, committing, or releasing without explicit approval.

## Research References

* [`research/oc-prompt-cache-review.md`](research/oc-prompt-cache-review.md) — review of reusable and rejected package behavior.

## Technical Notes

* Runtime entry: `index.ts`; permanent tests: `tests/tool-ordering.test.ts`.
* Existing prompt optimization remains `stripSessionOverviewChurn` → skill compression → `optimizeSystemPrompt` in `before_agent_start`.
* Tool ordering is implemented only in `before_provider_request` and does not alter prompt hooks.
* Binding contracts: `.trellis/spec/frontend/cache-adapter-footer-stats.md`, `hook-guidelines.md`, `state-management.md`, `privacy-guidelines.md`, and `quality-guidelines.md`.
* Reference package: `@touchtechclub/pi-oc-prompt-cache@0.1.0`, package page https://pi.dev/packages/@touchtechclub/pi-oc-prompt-cache?name=context&page=10.
