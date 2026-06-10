# Backend Tradeoffs

1. Tradeoff: `TypeORM synchronize=true` vs migrations
   Where: `backend/src/app.module.ts`, `backend/src/database/data-source.ts`, `backend/src/migrations/`
   Description: `synchronize: true` (and `autoLoadEntities`) makes development fast by auto-syncing schema changes, but risks data loss and schema drift in production. The repo also contains migration scripts, creating duplication and the possibility of inconsistent deployment practices.
   \
   Suggested changes:

- Disable `synchronize` in production (use an env flag) and rely on explicit migrations for schema changes.
- Add CI checks that run migrations (or a dry-run) to ensure schema and migrations stay in sync.
- Standardize on either auto-sync for local development or migrations-only workflow, document the chosen process.

2. Tradeoff: Multi-stage Docker build but reinstalling prod deps
   Where: `backend/Dockerfile`, `backend/package.json`
   Description: The Dockerfile uses a builder stage to compile TypeScript but then runs `npm install --omit=dev` again in the final image instead of copying `node_modules` from the builder. That increases build time and network usage vs copying installed deps, but keeps the final image smaller by only including production packages. There's also a minor CMD mismatch risk between `node dist/src/main` (Dockerfile) and `node dist/main` (`package.json`), which could cause runtime failures if build output paths differ.

Suggested changes:

- In the builder stage run `npm ci` and copy production `node_modules` into the final image (or use `npm prune --production`) to avoid reinstalling.
- Verify and standardize the runtime entrypoint (use `node dist/main` or update build output) and align `package.json` `start:prod` and Docker `CMD`.
- Consider using `NODE_ENV=production` and a lockfile-based install for reproducible builds.

3. Tradeoff: Throttling strictness (low rate limits)
   Where: `backend/src/app.module.ts` (ThrottlerModule.forRoot)
   Description: The global rate limiter (ttl=60, limit=10) protects against abusive traffic but may be too restrictive for legitimate bursts (APIs with multiple parallel calls), affecting user experience. Fine-grained rules would provide better balance.

Suggested changes:

- Make rate limits configurable via env vars and increase defaults to reflect expected traffic.
- Apply route- or role-based throttling where necessary (e.g., more generous limits for authenticated users).
- Add tests and metrics to detect false positives and tune limits over time.

4. Tradeoff: Observability (Prometheus + Loki middleware) vs runtime overhead
   Where: `backend/src/common/middleware/prometheus.middleware.ts`, `backend/src/common/middleware/LokiMiddleware.ts`, `backend/src/metrics/`
   Description: Integrating metrics and structured logging improves monitoring and debugging but adds runtime overhead and potential complexity in instrumentation. Misconfigured metrics or high-cardinality labels can increase memory/CPU usage.

Suggested changes:

- Make metrics and logging middleware configurable (enable/disable via env) and add sampling for high-traffic endpoints.
- Avoid high-cardinality labels; document allowed label sets and validate them.
- Add integration tests and resource monitoring to measure overhead before enabling in production.

5. Tradeoff: Homegrown cosine similarity and chunking strategy
   Where: `backend/src/chatbot/rag.service.ts`
   Description: The service implements simple fixed-size character chunking (500 chars) and an in-process cosine function. This is easy to reason about but ignores tokenizer boundaries, semantic chunking, and performance-optimized numeric libraries. It may produce suboptimal retrievals and slower compute for larger embeddings sets.

Suggested changes:

- Implement tokenizer- or sentence-based chunking and preserve semantic boundaries (use libraries or heuristics).
- Precompute and store vector norms to speed up cosine similarity or use BLAS/optimized libraries.
- Consider delegating similarity search to a vector store for speed and scalability.
