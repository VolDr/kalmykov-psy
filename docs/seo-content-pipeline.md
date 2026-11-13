# SEO content pipeline — kalmykov-psy.ru

**Working branch:** `wip-2`. **Publication:** disabled by design. Existing article content is **not** used for planning, examples or generation; old slugs are read only to prevent duplicate URLs.

## Project audit

- SvelteKit 3, Svelte 5, TypeScript, Node adapter, PostgreSQL and Drizzle.
- Existing legacy articles are in `content/articles/*.md`, while a separate article service stores content in a database. The pipeline does not modify either source.
- `src/routes/articles/+page.server.ts` and `src/routes/articles/[uri]/+page.server.ts` currently return 404 with `X-Robots-Tag: noindex, nofollow`. **Do not assume the old article routes are live.**
- `src/routes/sitemap.xml/+server.ts` exists but has no article URLs. `static/robots.txt` references the sitemap. Layout supports canonical URLs; the article component contains Article/BreadcrumbList JSON-LD, but a server 404 overrides the apparent client UI.
- `docs/analytics.md` documents existing Yandex Metrika and internal events in PostgreSQL. This tool only reads **aggregate** traffic-source metrics. It does not collect questionnaire responses or session IDs, nor does it claim to attribute consultations to specific articles without a validated aggregate event.

## Architecture

```text
Google Search Console ─┐
Yandex Webmaster ──────┼─> collect (28 / 90 days) ──> snapshots/
Yandex Metrika ────────┘
                                      │
                              plan (clusters/intents,
                              positions 8–20, priority)
                                      │
                         topic → topics/<id>/brief.json
                                      │
                  SERP / independent research Codex agent
                       Crossref DOI metadata verification
                                      │
                              research.json
                                      │
                       writer Codex → draft-vN.json
                                      │
                         independent review agents
                     A: scientific accuracy / safety
                     B: SEO and intent
                     C: AI-slop 1–10, pass <= 3
                     D: Playwright mobile + desktop,
                        screenshots reviewed by Codex
                                      │
                   4 passed checks + matching draft hash
                                      │
                        human approval required
                                      │
                    separate manual release process
                                      │
                     monitor 7 / 21 / 60 days
```

Generated files are under `storage/seo-pipeline/` (ignored by Git). Re-running a topic uses a deterministic ID; unchanged draft hashes do not produce a new version. `state.json` stores versions and decisions. A review is invalidated when content changes. Dry-run performs no external calls or writes. A failing review can generate a targeted revision and a new independent review without relaxing thresholds.

Crossref verifies a DOI's publication metadata, **not** whether a claim is actually supported. Scientific reviewer A must assess each claim, source type, clinical applicability and limitations. If this is impossible, it must fail. Nothing with missing evidence can be automatically published.

## Missing integrations and credentials

Use shell environment variables or your **ignored** local `.env` loader; never commit credentials.

| Integration | Variables | Notes |
|---|---|---|
| Google Search Console | `SEO_GSC_TOKEN`, `SEO_GSC_PROPERTY` | OAuth bearer token with read-only Search Console scope; exact property such as `sc-domain:kalmykov-psy.ru` |
| Yandex Webmaster | `SEO_YANDEX_TOKEN`, `SEO_YANDEX_USER_ID`, `SEO_YANDEX_HOST_ID` | OAuth token; popular search queries endpoint is incomplete and lacks page dimension |
| Yandex Metrika | `SEO_METRIKA_TOKEN`, `SEO_METRIKA_COUNTER_ID` | Aggregate traffic-source visits only; conversion goal integration remains future work |
| SERP competition | `SEO_SERPAPI_KEY` or `--serp-file=...json` | No invented SERP results or search volume |
| Codex CLI | Authenticated `codex` executable | Used for independent research, writing and four reviews |
| Playwright | Installed `playwright` and Chromium | For screenshots; install only if actually needed |
| Crossref | Public HTTPS access | DOI metadata check; does not verify clinical inferences |

Google Search Console returns top queries, not guaranteed exhaustive results. Yandex Webmaster popular queries are likewise a limited subset. A dedicated keyword research provider (e.g. licensed Wordstat integration) can be added once accounts and demand data exist. Competition and demand remain `unknown` if not measured.

## Runbook

Requires Node.js >=22.17. Run at repository root:

```bash
node --test scripts/seo/core.test.mjs
node scripts/seo/cli.mjs help
node scripts/seo/cli.mjs collect --dry-run
node scripts/seo/cli.mjs collect
node scripts/seo/cli.mjs plan
node scripts/seo/cli.mjs plan --input=scripts/seo/fixture-search.json
node scripts/seo/cli.mjs topic --query="как справиться с самокритикой" --slug=samokritika-chto-delat --format=article
node scripts/seo/cli.mjs research --id=<returned-id>
node scripts/seo/cli.mjs draft --id=<returned-id>
node scripts/seo/cli.mjs review --id=<returned-id>
node scripts/seo/cli.mjs cycle --id=<returned-id> --revisions=2
node scripts/seo/cli.mjs status --id=<returned-id>
node scripts/seo/cli.mjs monitor --id=<returned-id>
node scripts/seo/cli.mjs demo
```

`fixture-search.json` contains **fabricated numbers strictly for software tests**, not real site metrics. The command `demo` creates an entirely new, offline demonstration brief and short test draft with a real known DOI candidate. It does **not** claim to have run genuine web research, Codex or Playwright. It deliberately records these steps as blocked. It writes nothing to live routes or PostgreSQL. The fixture can never pass the release gate.

`research` is blocked until SERP evidence exists; scientific source candidates from Codex are individually checked against Crossref. `draft` requires verified DOI metadata. `review` needs Codex and actual Playwright screenshots of a **standalone local preview**; the real SvelteKit page must still be checked on staging. `cycle` can revise at most 2 times by default and stops instead of fabricating reviewer success.

## Release and monitoring

This MVP has **no publish/merge/DB-insert command**. A pass means only `passed-for-human-approval`. Actual publication requires explicit human approval and a separate release PR. That release must verify: route HTTP 200, correct canonical, no `noindex`, sitemap membership, Article/Person JSON-LD, internal link targets, responsive UX against the **actual website**, and analytics consent requirements. Ordinary articles should not use Google Indexing API. Bing URL submission can be supported later with proper API access.

`monitor` is inert until `topics/<id>/publication.json` has a genuine human-verified `approvedByHuman`, ISO `publishedAt` and real `url`. At day 7, 21 and 60 it compares saved URL-level GSC snapshots when available and returns `missing-comparable-metrics` rather than invented numbers when not. Conversions (article → booking click → consultation request) require additional instrumentation and validated aggregate attribution; until then they are `null`, not zero. No automatic rollback.

## Public API docs

- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://yandex.ru/dev/webmaster/doc/en/reference/host-search-queries-popular
- https://learn.chatgpt.com/docs/non-interactive-mode
