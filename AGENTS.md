# AGENTS.md

Scope: whole repo; concise rules for agent workflows.

Build/Dev: `pnpm install`; `pnpm dev` (or `--filter <ws> dev`).
Build: `pnpm build` (or `--filter api-v2|teacher-client build`).
Lint/Format/Types: `pnpm lint`, `pnpm format`, `pnpm check-types`.
Worker: `pnpm --filter api-v2 deploy`; type bindings: `pnpm --filter api-v2 cf-typegen`.
DB tooling (local): `pnpm --filter api-v2 migrate:local`, `seed:local`, `db:reset`.

Tests: Add `test` scripts per workspace; run via root `pnpm test` (Turbo).
Single test: scope with `pnpm --filter <ws> test -- <runner-args>` (e.g. Vitest `-t <name>`).

Imports: use `@/` in `teacher-client`, workspace protocol `"workspace:*"` in packages.
Import order: node/built-ins, external deps, workspace modules, relative; prefer named exports.
Formatting: Prettier defaults; run `pnpm format` before committing.
Types: TypeScript everywhere; avoid `any`; narrow with generics; prefer `zod` for runtime validation.
Cloudflare Worker: use `CloudflareBindings` types; return `c.json(...)` with explicit status; no raw throws.
React: PascalCase components; hooks `use*`; files in `apps/teacher-client/src/components`.
Backend routes: descriptive handlers (e.g., `getAttendance`); keep logic in `apps/api-v2/src/routes`.
Error handling: validate inputs, handle expected errors with 4xx, unexpected with 5xx; log minimally, no secrets.
i18n/UI: prefer `react-i18next` strings; show user-facing errors via toasts (sonner).
Commits/PRs: emoji + conventional type (`🚀 feat(scope): ...`); call out env/bindings.
Cursor/Copilot: no rules found in `.cursor/`, `.cursorrules`, or `.github`.
