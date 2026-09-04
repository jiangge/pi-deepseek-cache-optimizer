# DeepSeek protocol-safe compat and transactional rollback

## Goal

Resolve GitHub issue #10 without guessing a provider's reasoning wire protocol, while giving users a safe, friendly way to undo the latest confirmed `/cache-optimizer fix` when a provider rejects a changed request configuration.

## Requirements

- Keep DeepSeek model-family detection for the `DS cache` adapter, usage normalization, footer, and stats unchanged.
- Do not infer `thinkingFormat: "deepseek"` from a model id/name, provider id, or endpoint URL.
- Apply DeepSeek-specific reasoning/replay compat diagnostics only when effective `thinkingFormat` is explicitly `"deepseek"` on an `openai-completions` DeepSeek-like model.
- Do not list `thinkingFormat` as missing or add it to ordinary `/cache-optimizer fix` suggestions.
- Preserve generic OpenAI-compatible cache/routing diagnostics (`sendSessionAffinityHeaders`, optional long retention guidance, prompt cache key, and usage guidance) for DeepSeek-named models whose protocol is absent or non-DeepSeek.
- Explicit `thinkingFormat: "openai"`, `"qwen"`, `"openrouter"`, and `"together"` must be respected and must not trigger DeepSeek wire-protocol advice.
- `supportsReasoningEffort: true` alone must not prove either the DeepSeek or non-DeepSeek wire protocol.
- Keep adapter selection, cache stats, retention safety, routing, request behavior, and existing compatibility fields unchanged apart from the narrower diagnostics/fix scope.
- Add `/cache-optimizer rollback` as a native-completion, help, and interactive-menu command.
- A successful interactive `/cache-optimizer fix` must write one versioned, atomic, privacy-safe receipt containing only transaction id, provider/model identity, placement, changed compat keys and scalar before/after values, file hashes, backup filename, and timestamps. It must never persist credentials, prompts, payloads, headers, response bodies, or raw errors.
- Rollback must require UI confirmation and must use the existing backup/atomic replacement/access-mode-preservation contract.
- If the current `models.json` hash equals the recorded post-fix hash and the recorded backup matches the pre-fix hash, rollback may restore the exact pre-fix file through a new rollback backup and atomic rename.
- If the file hash changed, rollback must not overwrite unrelated user changes. It may surgically restore only receipt-owned compat scalar keys when the target entry existed before the fix and every owned key still equals its recorded post-fix value; otherwise it must refuse and provide manual backup guidance.
- A rollback transaction must preserve comments, credentials, unrelated fields, access mode, and caller/user changes; it must validate the resulting JSONC and remove/mark the receipt so the same fix is not repeatedly rolled back.
- Detect only explicit provider errors that reject the `thinking` parameter in favor of `reasoning_effort`; retain only a model-scoped process-local signal and never persist/display the complete error. If a matching fix receipt exists, notify the user that `/cache-optimizer rollback` is available. Do not auto-write or auto-rollback from a response hook.
- Update English/Chinese README and binding frontend specs for protocol-first DeepSeek diagnostics, receipt privacy, rollback safety, and command behavior.
- Add permanent tests for Issue #10, protocol matrices, fix suggestions, command completion/menu/help, receipt privacy/atomic rollback, changed-file refusal/surgical safety, access-mode preservation, and reasoning-error detection.
- Do not run commit, push, publish, release, or deployment operations without explicit user approval.

## Acceptance Criteria

- [x] A DeepSeek-named AMD-style OpenAI-compatible model with `supportsReasoningEffort: true` and no `thinkingFormat` receives no DeepSeek wire-protocol warning, no `thinkingFormat` fix, and retains generic cache diagnostics.
- [x] Explicit DeepSeek, OpenAI, Qwen, OpenRouter, and Together formats produce the expected protocol-specific or generic behavior.
- [x] DeepSeek footer/cache adapter behavior remains name-based and unchanged.
- [x] `/cache-optimizer fix` never invents `thinkingFormat: "deepseek"`.
- [x] `/cache-optimizer rollback` is available through direct execution, completion, menu, and non-interactive guidance.
- [x] Successful fixes create no-sensitive-data receipts and rollback restores only the owned change under the documented hash guards.
- [x] Changed `models.json` files are never blindly replaced by an old backup.
- [x] Explicit reasoning-protocol rejection detection is narrow, process-local, and non-persistent.
- [x] `npm run typecheck`, `npm test`, `npm run check:diff`, `npm run check:pack`, task validation, and relevant fixture checks pass.
- [x] No unrelated pre-existing working-tree changes are modified.

## Definition of Done

Runtime code, permanent tests, command UX, privacy-safe transaction receipt handling, synchronized English/Chinese documentation, and binding specs describe the same protocol-first and rollback behavior. Final verification records default behavior and explicit protocol matrix results. No release operation is performed.

## Research / decision

Issue #10 is valid: Pi 0.84.4 sends a `thinking` object for `thinkingFormat: "deepseek"`, while a standard OpenAI-compatible endpoint may reject it and request top-level `reasoning_effort`. Pi's catalog demonstrates that DeepSeek-named models also use `openai`, `qwen`, `openrouter`, `together`, or no explicit thinking format. Model family identity is therefore not protocol evidence.

Decision: use explicit effective `thinkingFormat` as the only DeepSeek wire-protocol signal, preserve generic cache/routing checks otherwise, and add a confirmation-gated transactional rollback rather than silently editing `models.json` from hooks.

## Verification record

- `npm run check` passed: TypeScript validation, all 88 permanent tests, `git diff --check`, and `npm pack --dry-run`.
- `PI_CACHE_OPTIMIZER_TOOL_ORDER=0 npm test` and `PI_CACHE_OPTIMIZER_TOOL_ORDER=1 npm test` both passed: 88 tests, 0 failures.
- `bun .trellis/tasks/09-03-deepseek-protocol-rollback/verify.ts` passed: 6 protocol cases, 0 generic protocol inferences, 1 directional rejection evidence case, 0 sensitive receipt fields, and surgical rollback preserved a later user change. Provider cache usage remained unavailable in the fixture-only run; no synthetic hit was claimed.
- Permanent coverage includes absent/non-DeepSeek explicit formats, command completion/help/menu/direct rollback, privacy-safe receipts, atomic mode-preserving exact and surgical rollback, duplicate-key refusal, symlink/hash/final-rename race refusal, cross-process transaction serialization, receipt snapshot CAS, and narrow reasoning-error correlation.
- No commit, push, publish, release, deployment, or other delivery operation was performed. The task remains locally dirty/in progress until an explicitly authorized handoff.
