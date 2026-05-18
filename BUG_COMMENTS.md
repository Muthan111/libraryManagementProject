# Bug Register

This document consolidates the inline `BUG` comments in the repository and classifies each issue against the current codebase state on 2026-05-18.

## Summary

- Total documented bug areas: 16
- Solved: 7
- Unsolved: 9

# Software Bug 1: Find methods lacked pagination

## Problem

Large `findAll()` queries were returning full datasets without paging, which could create heavy payloads and memory pressure.

## Source

`backend/src/user/user.service.ts`
`backend/src/book/book.service.ts`

## Cause

The original service methods used unbounded fetches.

## Solution

Add `page` and `limit` parameters, clamp them to safe ranges, and use `skip` / `take`.

## Implementation

Both user and book services now return paginated responses with `data` and `meta`.

## Status: Solved

# Software Bug 2: `main.ts` handled too many responsibilities

## Problem

Application bootstrap mixed startup, security, auth, filters, validation, and Swagger wiring in one file.

## Source

`backend/src/main.ts`

## Cause

Infrastructure setup was not extracted into dedicated modules.

## Solution

Split bootstrap concerns into focused setup files.

## Implementation

`setupSecurity.ts`, `setupAuth.ts`, `setupFilters.ts`, `setupSwagger.ts`, and `setupValidation.ts` are now used from `main.ts`.

## Status: Solved

# Software Bug 3: Entity code generation was coupled to database IDs

## Problem

Business identifiers such as `customerCode` and `bookCode` were tied to the primary key flow, forcing extra persistence work.

## Source

`backend/src/user/user.entity.ts`
`backend/src/book/book.service.ts`

## Cause

Codes were originally derived from saved IDs.

## Solution

Generate business codes independently before save.

## Implementation

`generateCode()` is used for user and book codes. The `User` entity no longer mixes `@PrimaryGeneratedColumn()` with a second primary column.

## Status: Solved

# Software Bug 4: Dangerous bulk-delete endpoint still exists

## Problem

The API still exposes a `DELETE /user` path that clears the full user table.

## Source

`backend/src/user/user.controller.ts`
`backend/src/user/user.service.ts`

## Cause

A destructive admin-style utility endpoint was left in the application without guardrails.

## Solution

Remove the endpoint or protect it behind strict authorization plus environment safeguards.

## Implementation

`deleteAllUsers()` still calls `userRepository.clear()`.

## Status: Unsolved

## Severity: Critical

# Software Bug 5: Sessions were stored in memory

## Problem

In-memory sessions would be lost on restart and would not scale across instances.

## Source

`backend/src/main.ts`
`backend/src/appSetup/setupAuth.ts`

## Cause

Session state was not persisted in a shared store.

## Solution

Use Redis-backed sessions.

## Implementation

`RedisStore` and `redisClient` are wired into session middleware.

## Status: Solved

# Software Bug 6: CORS was too permissive

## Problem

The API previously allowed unrestricted cross-origin access.

## Source

`backend/src/appSetup/setupSecurity.ts`

## Cause

`app.enableCors()` was used without origin restrictions.

## Solution

Restrict CORS to approved frontends and keep credentials explicit.

## Implementation

CORS is now limited to `http://localhost:5173` with `credentials: true`.

## Status: Solved

# Software Bug 7: Naming conventions are inconsistent across the codebase

## Problem

The codebase still mixes naming styles such as `customerCode`, `cusCode`, `bookid`, `Author`, and route segments like `customer-code`.

## Source

`backend/src/user/user.controller.ts`
`backend/src/book/book.entity.ts`
`backend/src/book/book.controller.ts`

## Cause

There is no single naming convention enforced for route params, DTO fields, entity fields, and method signatures.

## Solution

Standardize on one convention for API paths, params, entity properties, and DTO shapes.

## Implementation

Mixed naming is still present in the current code.

## Status: Unsolved

## Severity: Low

# Software Bug 8: Business controllers are missing authentication and authorization

## Problem

User, book, borrow, and chatbot endpoints are exposed without `JwtAuthGuard`, role checks, or bearer auth metadata.

## Source

`backend/src/user/user.controller.ts`
`backend/src/book/book.controller.ts`
`backend/src/borrow/borrow.controller.ts`
`backend/src/chatbot/chatbot.controller.ts`

## Cause

The auth module exists, but its guards are only used on the auth test endpoints.

## Solution

Attach authentication to protected controllers and add RBAC where needed.

## Implementation

No `@UseGuards(JwtAuthGuard)` or equivalent protection is applied to those business controllers.

## Status: Unsolved

## Severity: High

# Software Bug 9: `AuthService` still leaks data and uses weak contracts

## Problem

Authentication logic still logs sensitive lookup details, returns `any`, and silently returns `null` on failure.

## Source

`backend/src/auth/auth.service.ts`

## Cause

The service mixes debugging behavior with auth flow and does not use a strict return type.

## Solution

Remove sensitive logging, define a typed return contract, and use explicit auth errors or a documented null contract.

## Implementation

`validateUser()` still logs the user object, returns `Promise<any>`, and returns `null` on failure paths.

## Status: Unsolved

## Severity: High

# Software Bug 10: `LocalAuthGuard` login flow is still risky

## Problem

The local guard logs auth results and calls `super.logIn(request)` before checking whether authentication succeeded.

## Source

`backend/src/auth/local-auth.guard.ts`

## Cause

The guard implementation adds custom behavior without validating the boolean result first.

## Solution

Only log non-sensitive events, and call `logIn()` after a successful authentication result.

## Implementation

`await super.logIn(request)` runs unconditionally and the guard still writes auth state to the console.

## Status: Unsolved

## Severity: High

# Software Bug 11: JWT payload typing and trust assumptions remain weak

## Problem

JWT payload validation still uses `any` and trusts incoming payload fields without runtime shape validation.

## Source

`backend/src/auth/jwt.strategy.ts`

## Cause

The strategy was implemented with a broad payload type and no explicit payload schema.

## Solution

Define a typed JWT payload interface and validate required claims before returning the request user object.

## Implementation

`validate(payload: any)` still returns mapped fields directly from the token payload.

## Status: Unsolved

# Software Bug 12: `JwtAuthGuard` comment is stale, but behavior is acceptable

## Problem

There is an inline note about not overriding `canActivate()`, but the current guard simply extends `AuthGuard('jwt')`, which is valid behavior.

## Source

`backend/src/auth/jwt-auth.guard.ts`

## Cause

The comment treats a style inconsistency as a functional bug.

## Solution

Either remove the stale bug comment or keep the guard minimal.

## Implementation

The current implementation is acceptable and does not require a custom override.

## Status: Solved

# Software Bug 13: User entity constraints are still incomplete

## Problem

The `User` entity still lacks stronger data-integrity constraints such as a unique email and clearer password-storage hardening at the entity level.

## Source

`backend/src/user/user.entity.ts`

## Cause

Only `customerCode` is explicitly constrained as unique.

## Solution

Add missing uniqueness and column-level protections where appropriate.

## Implementation

`email` is still a plain `@Column()`. Passwords are hashed in the service layer, but the entity comments about integrity remain only partially addressed.

## Status: Unsolved

## Severity: Medium

# Software Bug 14: User creation still has race-condition risk

## Problem

User creation checks for duplicate email before insert, but the save is not wrapped in a transaction and there is no database-level unique email constraint.

## Source

`backend/src/user/user.service.ts`

## Cause

The service performs a read-then-write duplicate check in application code only.

## Solution

Add a database unique constraint for email and handle duplicate-key violations cleanly.

## Implementation

`create()` still does `findOne()` followed by `save()`.

## Status: Unsolved

## Severity: High

# Software Bug 15: User service update and lookup contracts are inconsistent

## Problem

The service still uses `find + save` update flow, keeps inconsistent identifier semantics, and returns `null` from `findUserByEmail()` while other methods throw exceptions.

## Source

`backend/src/user/user.service.ts`

## Cause

Service methods were added incrementally without a consistent contract for missing-record behavior and update patterns.

## Solution

Normalize service contracts and tighten update behavior.

## Implementation

The current service still mixes customer-code-based lookup, silent `null` returns, and a non-atomic update path.

## Status: Unsolved

# Software Bug 16: Chatbot hardening is only partially complete

## Problem

Several original chatbot issues were fixed, but some production risks remain: no rate limiting, no explicit Gemini error handling, prompt-injection exposure, AI-to-DB tight coupling, and possible overexposure of raw tool results.

## Source

`backend/src/chatbot/chatbot.service.ts`
`backend/src/chatbot/chatbot-conversation.store.ts`
`backend/src/chatbot/chatbot.service.spec.ts`

## Cause

The chatbot service was improved in stages, fixing infrastructure gaps before security and output-governance concerns were fully addressed.

## Solution

Keep the solved improvements, then add rate limiting, safer tool-response shaping, explicit provider error handling, and stronger prompt/tool boundaries.

## Implementation

Solved in current code:
- Timeout protection exists through `withTimeout()`.
- Conversation persistence exists through `ChatbotConversationStore`.
- Multi-step tool handling exists through `MAX_TOOL_ITERATIONS`.
- Testability improved through dependency injection and unit tests.

Still open in current code:
- No request rate limiting around chat entry points.
- No service-level catch/translation for Gemini provider failures.
- Tool responses are passed back to the model with minimal output filtering.
- `ChatbotService` still directly depends on `BookService`.

## Status: Unsolved

## Severity: High
