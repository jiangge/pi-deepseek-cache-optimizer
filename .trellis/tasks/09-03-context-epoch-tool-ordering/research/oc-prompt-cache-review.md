# Review: `@touchtechclub/pi-oc-prompt-cache@0.1.0`

## Source inspected

* Pi package page: https://pi.dev/packages/@touchtechclub/pi-oc-prompt-cache?name=context&page=10
* npm package source: `index.ts` (13,247 bytes), `README.md`, `package.json`.
* Installed Pi 0.84.4 extension and session docs.

## Reusable idea

* Deterministic tool ordering can remove cache churn caused by extension registration order when limited to verified built-in payload shapes.

## Risks found

* The package persists the complete system prompt in a session custom entry. That violates this project's no-raw-prompt persistence contract.
* It puts arbitrary changed instructions into a lower-priority custom message claiming to supersede the system prompt. Changed security, tool, or project instructions must instead start a new epoch.
* Its line diff is only common-prefix/common-suffix extraction and can fall back to embedding the full prompt.
* Its `getEntries()` restore scan is not clearly active-branch-scoped.
* Its trailing Anthropic breakpoint helper shares cache-control object references, rewrites string content to arrays, does not validate block types/limits, and can reintroduce invalid TTL ordering after this project's validator.
* Its Gemini path is less strict about missing tool names; generic payload mutation can affect custom transports.

## Project decision

Implement only deterministic tool ordering as a conservative, default-off, pure helper for verified built-in shapes. Shallow-clone only the changed path and preserve tool markers, deferred groups, special SDK objects, and transport behavior. Do not copy trailing breakpoint logic.

Context Epoch was rejected entirely after integration review. Pi normally emits byte-identical prompts, so the practical gain was small, while prompt baselines, lifecycle resets, cache-hints restrictions, and returned update messages created additional correctness and privacy risk. In particular, Pi persists `before_agent_start` custom messages as session entries. The project prioritizes stability, so no prompt epoch, baseline, fingerprint, message, or environment gate is retained.
