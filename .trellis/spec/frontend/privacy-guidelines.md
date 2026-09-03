# Privacy Guidelines

> Binding privacy rules for `pi-cache-optimizer` request transformations.

## Trust boundary

Pi prompt options, assembled system prompts, provider payloads, headers, assistant messages, route snapshots, and usage data are external or sensitive inputs. The extension may inspect them at hook boundaries only to perform documented transformations. Diagnostics and persisted state must never expose their raw contents.

## Deterministic tool ordering

`PI_CACHE_OPTIMIZER_TOOL_ORDER` is an explicit truthy opt-in (`1`, `true`, `yes`, or `on`, case-insensitive) and is gated by runtime enablement. The feature has no persistent state.

The pure normalizer may sort only verified built-in payload shapes for allowlisted Pi APIs. It must return the caller's original payload for unknown/custom APIs, unsupported wrappers, malformed tools, missing/blank names, or unrecognized schemas. It sorts by exact tool name and original index, preserves every tool field and request-control field, and never mutates caller input.

When order changes, the helper shallow-clones only the root/container/tool-array path. Tool objects and unrelated request fields retain identity, including Google/Vertex SDK objects and `AbortSignal`. Google/Vertex tools must be read from Pi's actual `payload.config.tools[].functionDeclarations` path.

Any supported tool array carrying a top-level tool `cache_control` field is a deliberate no-op. This covers native Anthropic and OpenAI-compatible Anthropic cache formatting. Anthropic arrays containing `defer_loading` are also no-ops because the array encodes immediate/deferred grouping. Existing cache-control and TTL validation remains authoritative; this feature must not move a cache breakpoint or add a trailing breakpoint. The request hook must compose ordering with existing TTL, retention, prompt-cache-key, routing, and adapter logic rather than returning early.

## Verification privacy

The task verifier uses deterministic local fixtures only. It may report changed-tool counts and unchanged cache-marker counts. It MUST NOT print prompts, prompt diffs, payloads, headers, session ids, credentials, response bodies, or usage values presented as provider cache evidence. Fixture-only runs must explicitly say that provider cache usage is unavailable and must never claim synthetic cache hits.

## Scenario: privacy-safe deterministic tool ordering

### 1. Scope / Trigger

This contract applies when the opt-in environment gate is enabled during provider-request hooks. It covers deterministic sorting of verified built-in tool payloads.

### 2. Signature

```ts
normalizeToolsInPayload(payload, api): { payload: unknown; changed: boolean };
```

`PI_CACHE_OPTIMIZER_TOOL_ORDER` accepts only `1`, `true`, `yes`, or `on` as opt-in values and is additionally gated by runtime enablement.

### 3. Contracts

- Sorting is exact-name/index stable, immutable, allowlisted, and composed with existing request mutations.
- The pure helper may verify OpenAI Responses fixtures, but the request hook preserves the existing Responses/Codex bypass.
- Cache-marked tools and Anthropic deferred-tool groups remain unchanged.
- Shallow path cloning preserves unrelated special-object and tool-object identity.
- No prompt baseline, epoch, or durable prompt-derived state is introduced.

### 4. Validation & Error Matrix

| Condition | Behavior |
|---|---|
| Gate absent/non-truthy or runtime disabled | Do not reorder; retain the normal request pipeline. |
| Unknown API, malformed tool, missing name, unsupported wrapper, tool cache marker, or Anthropic deferred grouping | Return the original payload unchanged. |
| Google/Vertex payload contains `AbortSignal` | Sort the verified `config.tools` path while retaining the signal by identity. |
| Verified payload is already sorted or has equal-name ties | Return the original payload and preserve original order. |

### 5. Good / Base / Bad Cases

- **Good**: a Google payload sorts `config.tools[].functionDeclarations` while preserving `config.abortSignal` and tool objects by reference.
- **Base**: a malformed, custom, cache-marked, deferred, or already sorted payload is returned unchanged.
- **Bad**: the full payload is cloned, caller input is mutated, or sorting moves an OpenAI-compatible `cache_control` marker.

### 6. Tests Required

- Assert immutable sorting for every allowlisted built-in shape, actual Google/Vertex nesting, `AbortSignal` identity, exact ordering and ties, and field preservation.
- Assert all-API cache-marker no-op, Anthropic deferred-group no-op, malformed/custom/unknown no-ops, Responses hook bypass, runtime/env gates, and composition with TTL/retention/cache-key behavior.
- Run the fixture verifier and confirm it reports only structural ordering metrics and unavailable provider cache measurements.

### 7. Wrong vs Correct

```ts
// Wrong: full cloning can reject SDK objects and breaks identity semantics.
const clone = structuredClone(providerPayload);
clone.tools.sort(compareByName);

// Correct: validate first and shallow-clone only the changed path.
const normalized = normalizeToolsInPayload(providerPayload, api);
return normalized.changed ? normalized.payload : undefined;
```

## Review checklist

- [ ] Tool ordering is off by default and suppressed by runtime disable.
- [ ] Sorting is allowlisted, immutable, stable, shallow-cloned, and cache-control/grouping safe.
- [ ] Unknown/custom/malformed payloads are exact no-ops.
- [ ] No prompt, payload, headers, credentials, response bodies, or raw session ids are persisted or logged.
- [ ] README, binding spec, hook/state docs, tests, and verifier describe the same behavior.
