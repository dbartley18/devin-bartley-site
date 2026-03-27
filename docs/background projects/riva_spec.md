# Riva — Agentic Career Intelligence Spec

**Version:** v0.1  
**Date:** Aug 12, 2025  
**Owner:** Devin (PM/Founder)  

Table of Contents

[Riva — Agentic Career Intelligence Spec 1](#_Toc205975161)

[1) Purpose & Product Thesis 1](#_Toc205975162)

[Primary outcomes: 1](#_Toc205975163)

[Non‑goals (v1): 1](#_Toc205975164)

[2) Target Users & Personas 1](#_Toc205975165)

[Top jobs to be done (JTBD): 2](#_Toc205975166)

[3) Success Metrics (North Star + Leading) 2](#_Toc205975167)

[4) Scope (v1 MVP) 3](#_Toc205975168)

[5) System Architecture 3](#_Toc205975169)

[5.1 High‑level 3](#_Toc205975170)

[6) Data Models (draft) 4](#_Toc205975171)

[7) Agents & Responsibilities 5](#_Toc205975172)

[8) Flows (MVP happy paths) 7](#_Toc205975173)

[8.1 Onboarding 7](#_Toc205975174)

[8.2 Reverse Headhunter (default) 7](#_Toc205975175)

[8.3 New Case from JD/URL (manual path) 8](#_Toc205975176)

[8.4 Weekly Synthesis 8](#_Toc205975177)

[9) Explainability & UX 8](#_Toc205975178)

[10) External Integrations & Permissions 8](#_Toc205975179)

[11) Evaluation & QA Plan 9](#_Toc205975180)

[12) Privacy, Security, and Data Retention 9](#_Toc205975181)

[13) API Surface (internal, MVP) 10](#_Toc205975182)

[14) Technical Choices & Tradeoffs 10](#_Toc205975183)

[15) Roadmap 10](#_Toc205975184)

[Phase 1 (4–6 weeks of effort, single dev): 10](#_Toc205975185)

[Phase 2: 10](#_Toc205975186)

[Phase 3: 11](#_Toc205975187)

[Phase 4: 11](#_Toc205975188)

[16) Risks & Mitigations 11](#_Toc205975189)

[17) Open Questions 11](#_Toc205975190)

[18) Acceptance Criteria (MVP) 11](#_Toc205975191)

[19) Appendix 12](#_Toc205975192)

Intentionally Left Blank

## 1) Purpose & Product Thesis

Riva is an **agentic career co‑pilot** for senior/executive job seekers. It goes beyond keyword stuffing to manage **trajectory, positioning, sourcing, application execution, and interviewing**, with explainability and measurable funnel outcomes.

**No‑paste default:** Riva **sources opportunities for you** from your profile and resume—**pasting JDs is optional**.

### Primary outcomes

- Increase warm intros / interview conversions per application.
- Reduce time to offer by improving targeting and follow‑through.
- Maintain a single source of truth ("Case") per opportunity.

### Non‑goals (v1)

- Autonomous email sending on user’s behalf.
- Fragile social scraping that violates site TOS.
- Full recruiter CRM feature set.

# 2) Target Users & Personas

1. **Exec Switcher (primary):** Director+ seeking next role; values narrative, comp, team quality. Tech‑comfortable; privacy‑sensitive.
2. **Senior IC Level‑Up:** IC5–IC7 looking for Staff/Principal; cares about matching and interview prep.
3. **Senior Consultant / Manager (Consulting & Professional Services):** Experienced‑hire candidates navigating lateral moves and manager promotions; frequent case/PEI processes; strict resume formats; confidentiality constraints.
4. **Senior IC → Executive (Cross‑Industry, General Audience):** Staff/Principal/EM through Director+ across functions and industries (function-agnostic). Needs precision targeting, ATS‑safe artifacts, tailored outreach, and interview coaching; **default persona** for non‑consulting roles.

### Top jobs to be done (JTBD)

- “Tell me which roles are worth my time and why.”
- “Create a targeted resume + outreach in minutes, not hours.”
- “Keep me on track across threads and follow‑ups.”
- “Coach me for this specific interview panel.”
- “Translate confidential client work into anonymized, metrics‑driven achievements.”

Note: Consulting/professional services is an **explicit preset**, not an exclusive market. The product serves senior ICs and executives across industries (TMT, healthcare, fintech, etc.).

## 3) Success Metrics (North Star + Leading)

- **NSM:** Offers per 100 targeted applications (or onsite rate per targeted application for earlier signal).
- **Leading indicators:**
  - **Recommendation accept→apply rate** (% of recs that become Cases/applications).
  - CTR on recommendation cards.
  - Recruiter reply rate (%) on outreach emails.
  - Screen → onsite conversion rate.
  - **(Consulting preset)** Case/PEI pass‑to‑final (partner‑round) rate.
  - Time from recommendation selection → tailored resume (median minutes; target ≤ 10).
  - Explanation coverage (JD requirements mapped to resume evidence ≥ 80%).
- **Model metrics (offline):**
  - Precision@5 and nDCG@10 on recommendations; rank correlation (Kendall/Spearman) of match score vs. human labels ≥ 0.5 by v1.
  - ATS text integrity (parseable sections, dates recognized) ≥ 95% across test PDFs.

## 4) Scope (v1 MVP)

**User flow:** Upload resume → **Reverse Headhunter** auto‑sources curated roles from the user’s resume + profile → receive 1) ranked recommendations with match explanations, 2) ATS‑safe tailored resume variant (with diff) for the selected role, 3) outreach email (2 tone options), 4) create Case and (optional) apply Gmail label. _Optional:_ paste JD/URL to create a manual Case via the same flow.

**Platforms:** Web app (desktop‑first). Optional Streamlit prototype acceptable for MVP.

**Integrations (opt‑in):** Gmail read‑only + label create; Levels.fyi (public ranges); Career page RSS where available.

## 5) System Architecture

### 5.1 High‑level

- **Agent Orchestration:** LangGraph (deterministic nodes; retries; event bus).
- **LLM Backbone:** External (Claude/GPT‑4 class) behind an adapter; optional local SLM for light tasks.
- **Vector Store:** pgvector or Qdrant. Embeddings for JD chunks, resume segments, knowledge snippets.
- **DB:** Postgres (Supabase okay) for users, cases, artifacts, events, auth.
- **Object Store:** Resume files, exported variants (PDF/DOCX).
- **Event Bus:** App‑level events (JD_INGESTED, RESUME_UPDATED, OUTREACH_DRAFTED, EMAIL_THREAD_TAGGED).
- **Frontend:** React (or Streamlit for MVP).

**5.2 Core Domain Objects**

- **User**: profile, preferences, comp history (optional), voice/polish level.
- **Case**: per‑opportunity container (JD, company, status, artifacts, interactions, metrics).
- **JobPosting**: source URL + parsed metadata + canonical skills + comp range (with confidence).
- **Artifacts**: resume variants, cover letters, outreach emails, interview notes.
- **Events**: append‑only audit log powering analytics + Weekly Synthesis.

## 6) Data Models (draft)

// job_posting

{

"id": "uuid",

"company": "string",

"title": "string",

"level": "IC6/Director/etc",

"location_mode": "remote/hybrid/on-site",

"locations": \["city,country"\],

"role_family": "Consulting|Product|Eng|Ops|…",

"capabilities": \["Strategy", "Ops", "Pricing", "DD/PE", "Transformation"\],

"industries": \["TMT", "Healthcare", "FS", "CPG/Retail", "Energy"\],

"engagement_types": \["Market entry", "Profitability", "PMI", "Turnaround"\],

"skills_required": \["Go", "LLM eval"\],

"must_haves": \["work authorization US"\],

"nice_to_haves": \["fintech"\],

"jd_text": "…",

"embedding": "vector",

"source_url": "string",

"detected_comp": {"min": 220000, "max": 280000, "currency":"USD", "confidence":0.62}

}

// case

{

"id": "uuid",

"user_id": "uuid",

"job_posting_id": "uuid",

"status": "sourced|applied|screen|onsite|offer|rejected",

"artifacts": {

"resume_variant_id": "uuid",

"cover_letter_md": "string",

"emails": \["…"\]

},

"interactions": \[{"ts":"iso","channel":"email","summary":"…"}\],

"scorecard": {

"overall": 0.81,

"skills_gap": \[{"skill":"Kubernetes","gap":"medium"}\],

"capability_match": 0.72,

"industry_track": 0.68,

"explainability": \["Matches: ‘LLM eval’ → Resume/Projects line 3"\]

}

}

// user_profile (global memory)

{

"id":"uuid",

"summary":"short bio",

"skills": \["GenAI Platform", "Org design"\],

"industries": \["Fintech", "SaaS", "Healthcare"\],

"capabilities": \["Pricing", "Ops", "Strategy"\],

"case_exposure": \[{"capability":"Profitability","count":7}\],

"achievements": \[{"title":"…","impact":"$X revenue"}\],

"voice": {"tone":"exec", "assertiveness":0.6},

"anonymization_policy": "standard|strict"

}

## 7) Agents & Responsibilities

1. **Reverse Headhunter (Opportunity Radar)** _(Phase 1 default)_

- **Inputs:** user resume + profile (skills, capabilities, industries, seniority, geo prefs), target company lists, curated career pages & VC portfolios, sanctioned job APIs; _optional_ URLs/RSS pasted by user (fallback path).
- **Processing:** build an Intent Profile → query sources → rank via composite relevance (capability/industry/skill/level/location) → dedupe by company+title+location.
- **Outputs:** ranked recommendations with short "why this" rationales, tags for **capabilities/industries/engagement_types**, confidence score.
- **Guardrails:** TOS‑compliant sources, scrapers behind feature flags, explainable ranking features logged for audit.

1. **Resume–JD Matcher** (Phase 1)

- Compute composite score and produce explanation table with anonymized evidence mapping when needed.
- **Score S:**  
    S = 0.30·embedding_sim + 0.20·canonical_skill_overlap + 0.15·must_have_gate + 0.15·capability_match + 0.10·seniority_match + 0.10·industry_track
- Must‑have gate is binary but **explains failures** by citing JD lines.

1. **ATS Optimizer** (Phase 1)

- Normalize sections; expand acronyms on first use; ISO-ish dates; no text boxes/columns.
- **Consulting preset:** auto‑anonymize client names (e.g., “Fortune 100 CPG”), and provide firm‑style export presets (1‑page tight layout, clean dates).
- Produce **diff view** and ATS‑safe plain‑text export.

1. **Application Assistant** (Phase 1)

- Outreach email (2 tones) + optional cover note.
- Outputs as clipboard/email‑ready blocks + DOCX/PDF resume variant.

1. **Comp Inference** (Phase 2/3)

- Multi‑signal (posting ranges, geo, level taxonomy, user history).
- Output P10/P50/P90 with confidence and source chips; optional **firm ladder normalization** for consulting/pro services.

1. **Inbox Monitor** (Phase 2)

- Gmail read‑only + labels: riva/applied, riva/recruiter, riva/followup-due.
- Ghosting heuristic triggers follow‑up suggestions.

1. **Interview Coach** (Phase 3)

- Stage‑aware playbooks, mock interviewer, rubric scoring.
- **Consulting preset modes:** Market entry, Profitability, Ops/SCM, M&A/DD; mental‑math timers; exhibit interpretation; PEI/fit library; **partner‑round** simulation focusing on top‑down synthesis and challenge handling.

1. **Weekly Synthesis** (Phase 2)

- Digest of events per Case; top 3 nudges.

1. **Market Pulse Agent** (Phase 2)

- **Purpose:** Detect shifts in hiring demand and surface _why-now_ opportunities that match the user’s Intent Profile.
- **Signals:** funding rounds, leadership moves, product launches/expansions, headcount spikes/freezes, major contracts, layoffs→rebuilds.
- **Outputs:** _Why this now_ tags on recommendations, periodic alerts (digest), and feature contributions to the ranker.
- **Guardrails:** only sanctioned/public sources; cite signals on each alert; rate-limit noisy firms.
- **Success target (alpha):** ≥2 high‑signal alerts/user/month with ≥25% alert accept→apply.

## 8) Flows (MVP happy paths)

### 8.1 Onboarding

1. Create account → upload baseline resume (PDF/DOCX).
2. Optional: connect Gmail (read + labels).
3. Set persona controls (tone/assertiveness), target roles, locations.

### 8.2 Reverse Headhunter (default)

1. System parses resume + profile to an **Intent Profile** (capabilities, industries, skills, seniority, location, constraints).
2. Query curated sources (career pages, VC portfolios, firm lists) and sanctioned APIs; apply filters from the Intent Profile.
3. Rank & dedupe → present **Top N recommendations** with a short rationale and confidence.
4. User opens a recommendation → details modal shows JD preview, **match explanation** (evidence chips), and (if available) comp estimate.
5. **Generate tailored resume variant** via ATS Optimizer; show **diff**.
6. **Draft outreach** (2 tones).
7. Save → **Case** created; optional Gmail label applied.
8. Feedback loop: user can 👍/👎 recommendations to refine future ranking.

### 8.3 New Case from JD/URL (manual path)

1. User pastes JD/URL → JD Ingestor parses text + metadata.
2. Matcher runs → score + explanation table.
3. ATS Optimizer produces tailored resume variant; diff shown.
4. Application Assistant drafts outreach (2 tones).
5. User saves → Case created; optional Gmail label applied.

### 8.4 Weekly Synthesis

- Summarize: cases by stage, follow‑ups due, gaps detected, wins.

## 9) Explainability & UX

- **Evidence mapping table** (columns): JD Requirement → Resume Evidence → Confidence → Suggested Line.
- **Source chips** on every claim (JD line#, resume section).
- **Diff viewer**: additions (green), removals (red), neutral edits (gray).
- **Persona slider**: Conservative ↔ Bold; presets for Exec Voice, IC Technical, Product Storyteller.
- **Consulting conveniences:** anonymization toggle & preview; firm template selector; capability/industry chips visible on Case and JD.

## 10) External Integrations & Permissions

- **Gmail/Outlook:** start read‑only scopes + label mgmt; no auto‑send in v1.
- **Job Sources:** curated career pages & VC portfolios + sanctioned job APIs; optional user‑provided URLs/RSS (fallback).
- **Compliance:** store minimal tokens; encrypted at rest; redact PII in logs; per‑tenant encryption keys.

## 11) Evaluation & QA Plan

**Offline (pre‑release):**

- **Recommendations dataset:** Build a corpus of ≥2,000 postings from curated sources. For each of ≥100 anonymized resumes, collect human relevance labels (0/1/2) across candidate postings.
- **Targets:** Precision@5 ≥ 0.60, nDCG@10 ≥ 0.70, duplicate rate ≤ 5%, explanation coverage ≥ 80% (≥2 grounded evidence citations per recommendation).
- **Parsing/ATS:** ATS parse success ≥ 95% across test PDFs.

**Online (alpha):**

- Instrument: intent_profile_built, recs_rendered, rec_opened, rec_selected, case_created_from_rec, outreach_copied, resume_variant_saved.
- KPIs: **accept→apply rate** from recommendations, CTR on rec cards, time‑to‑first‑artifact, reply rate uplift vs. baseline.
- **Consulting preset KPIs:** case/PEI pass‑to‑final rate; rubric score deltas by drill type (Relevance, Specificity, Outcome, Seniority Signal).
- **Market Pulse KPIs:** ≥2 high‑signal alerts/user/month; **alert accept→apply ≥ 25%**.

**Human‑in‑the‑loop:**

- Require confirmation before any artifact is marked “sent”.

## 12) Privacy, Security, and Data Retention

- **Storage:** Postgres (encrypted), object store for files, vector store with row‑level security.
- **PII handling:** redact emails/phone numbers in logs; rotate tokens.
- **Retention:** user‑controlled purge per Case; automated 90‑day deletion for inactive drafts.
- **Audit:** append‑only Events; exportable activity log.

## 13) API Surface (internal, MVP)

POST /api/recommendations { resume_id, profile, limit?, filters? } → { items: \[{ job_posting_id, score, explanations\[\], features }\], request_id }

POST /api/jd/ingest { url|text } → { job_posting_id }

POST /api/match { resume_id, job_posting_id } → { score, explanation\[\] }

POST /api/resume/variant { resume_id, job_posting_id, options } → { variant_id, diff }

POST /api/outreach/draft { case_id, tone } → { subject, body_md }

POST /api/case { job_posting_id, artifacts } → { case_id }

GET /api/case/:id → Case

## 14) Technical Choices & Tradeoffs

- **LangGraph** for explicit state transitions and retries vs. ad‑hoc chains.
- **pgvector** co‑located with Postgres for simplicity; Qdrant viable if we need hybrid search features.
- **Embeddings:** single high‑quality model; store per‑section vectors to support evidence mapping.
- **Doc parsing:** pypdf + heuristics; human fix‑up path always present.

## 15) Roadmap

### Phase 1 (4–6 weeks of effort, single dev)

- **Reverse Headhunter recommendations** (ranker + “Why this fit” cards + dedupe), JD ingest, matching + explanation, ATS resume variant (diff), outreach drafts, Case creation, minimal UI.
- Metrics + export.

### Phase 2

- Gmail read‑only labels, Weekly Synthesis, persona modeling, radar from curated sources.
- Comp inference (basic ranges + confidence).
- **Consulting preset**: taxonomy (capabilities/industries/engagements), bullet templates, anonymization rules, firm‑style exports.

### Phase 3

- Interview Coach (mock interviews, rubrics; consulting modes + partner‑round simulation), negotiation sandbox, richer analytics.

### Phase 4

- OAuth hardening, frontend polish, multi‑seat/team features, marketplace/SaaS packaging.

## 16) Risks & Mitigations

- **TOS & scraping:** keep sources user‑provided; feature‑flag scrapers; offer import/upload.
- **Hallucinations:** strict JSON schemas; cite sources; require confirmation.
- **ATS variability:** provide plain‑text export; continuous corpus of parser fixtures.
- **Email scopes risk:** avoid send‑on‑behalf in MVP; undergo security review later.
- **Confidentiality in consulting/pro services:** default anonymization of client names; sensitivity checker before exports; user‑controlled redaction rules.
- **Firm‑specific resume constraints:** ship export presets; validate section names/ordering before generation.

## 17) Open Questions

- Which two LLMs do we officially support at launch (cost/latency/quality)?
- Do we gate persona “boldness” based on seniority or company culture signals?
- How do we measure “targeting quality” independent of user network effects?
- Minimum viable comp inference without partner APIs?

## 18) Acceptance Criteria (MVP)

- **Reverse Headhunter** returns ≥ 15 deduped recommendations in ≤ 60 seconds for a typical resume; **Precision@5 ≥ 0.60** and **nDCG@10 ≥ 0.70** on held‑out test set.
- Each recommendation includes a **"Why this fit"** card with ≥ 3 grounded evidence chips (resume + JD lines) and a confidence score.
- Duplicate rate in a recommendation list ≤ 5% (by company+title+location).
- User can create a Case from a recommendation in ≤ 2 minutes end‑to‑end.
- Match score with explanation table renders with ≥ 80% JD coverage on test set.
- ATS‑safe resume variant exports to DOCX and PDF; diff view renders.
- Outreach email drafts (2 tones) available and copyable.
- Events captured; Weekly Synthesis skeleton page lists active Cases and nudges.

## 19) Appendix

- **Canonical Skills Taxonomy:** Start with O\*NET/ESCO + curated exec list.
- **Scoring Weights:** adjustable via feature flag; store per‑experiment.
- **Glossary:** Case, Evidence Mapping, Persona Slider, Ghosting Heuristic.

# Technical Architecture Deep Dive

## Service Topology (MVP → scalable)

- **Gateway/API**: FastAPI (Python) monolith exposing REST endpoints (§13). Handles auth, rate‑limits, request validation, idempotency keys.
- **Orchestrator**: LangGraph flows embedded in API for synchronous steps; background jobs via a worker pool for async tasks (LLM/gen, crawling, embeddings).
- **Workers**: Celery/Arq (Python) with Redis for queues. Dedicated pools: rec-gen, embedding, crawler, export.
- **DB**: Postgres (Supabase ok) with pgvector extension. Row‑level security by user_id.
- **Object Store**: S3‑compatible for resumes/exports. Pre‑signed URLs for client download.
- **Cache**: Redis for short‑lived artifacts (JD previews, rec lists) and feature flags.
- **Observability**: OpenTelemetry traces + Prometheus metrics + Sentry errors. Audit trail via events table.

## 20.2 Data Flow — Reverse Headhunter (default)

1. **Ingest Profile** → parse resume (pypdf/docx) → segment into sections → extract entities (skills, titles, industries, capabilities) → embed sections.
2. **Intent Profile Build** → normalize titles (e.g., IC ladder), seniority, geo, constraints (comp floor, visa), preferred domains.
3. **Source Fetch** → connectors pull postings from curated career pages, VC portfolios, sanctioned job APIs. Respect robots/TOS; throttle.
4. **Normalize Postings** → parse, dedupe (company+title+location), tag capabilities/industries, chunk JD, embed.
5. **Feature Extract** (per candidate × posting): cosine sims (resume↔JD), canonical skill overlap, capability/industry match, seniority distance, location fit, must‑have gate, MarketPulse “why‑now” features.
6. **Rank** → composite scorer v1 (linear weights), top‑K, hard filters (gates), diversity (company/industry), dedupe.
7. **Explain** → evidence retriever selects top JD lines + resume snippets that caused high similarity/overlap → render chips.
8. **Present** → rec cards (score, confidence, “why this fit”, “why now”), actions: open → create Case → generate ATS variant → outreach.
9. **Learn** → capture feedback (👍/👎/open/selected/applied) → update per‑user priors (bandit) and global LTR when enough data.

## 20.3 Ranking Roadmap (models & features)

- **v1 (launch):** Deterministic weighted formula (see §7). Diversity cap: max N per company; hard must‑have gate. Confidence = calibrated via historical label distribution.
- **v2 (post‑alpha):** Learning‑to‑Rank (LightGBM/XGBoost) trained on human labels (0/1/2) + implicit signals (opens, selects). Inputs: features in 20.2. Export to ONNX for inference in API.
- **v3 (personalization):** Per‑user contextual bandit on top of v2 to adapt weights (e.g., pref for hybrid NYC, specific capability). Thompson Sampling or LinUCB with safety rails.

**Key features (non‑exhaustive):**

- sim_mean/max (resume‑JD chunk cosine), skill_jaccard, cap_match, ind_match, seniority_delta, geo_distance/hybrid_flag, must_have_gate, recency_days, market_pulse_score, company_repeat_penalty, stale_post_penalty.

## 20.4 Matching & Explanation (RAG‑style)

- **Indexing:** store embeddings for (a) resume sections and (b) JD chunks with paragraph refs.
- **Retriever:** for each JD requirement, retrieve top resume spans; for each high‑sim span, map to requirement labels (capability/skill).
- **Explainer:** construct table rows = {JD requirement, Resume evidence, Confidence, Suggested line}. Confidence combines sim score + rule boosts (exact keyword +1, quant metric +0.5, proper noun − anonymization penalty).
- **Guardrails:** all facts must point to source spans; redact client names per user policy.

## 20.5 Connectors & Ingestion

- **Connectors:** Career page RSS/API, Greenhouse/Lever feeds where public, VC portfolio scrapes behind feature flag, sanctioned job APIs.
- **Fetcher policy:** retries w/ exponential backoff; max concurrency per domain; user‑agent + contact; cache 24–48h.
- **Deduping:** canonicalize company names; keys: (company_norm, title_norm, location_norm); shingle‑based near‑dup for cross‑postings.
- **Stale detection:** de‑rank or hide postings older than X days or marked closed.

## 20.6 Storage & Schema Notes

- **Tables:** users, profiles, resumes, jobs, cases, artifacts, events, sources, market_pulse_signals.
- **Indexes:** jobs(company_norm,title_norm,location_norm), cases(user_id,status), vector ivfflat/hnsw on jobs.embedding and resume_sections.embedding.
- **RLS:** jobs global read; cases/artifacts/events/resumes tenant‑scoped by user_id.
- **Blob pointers:** artifacts table stores object store keys + content hash for dedupe.

## 20.7 Security, Privacy & Keys

- **Secrets:** managed via KMS/parameter store; never in code. Token scopes: minimum necessary (Gmail read + labels only).
- **PII:** redact before logging; structured logs with PII flags. Per‑user encryption keys (envelope).
- **Deletion:** soft delete + background purge of blobs and vectors. User‑initiated purge per Case.
- **Audit:** append‑only events with actor, resource, and hash; exportable.

## 20.8 Observability & Quality

- **Golden routes:** synthetic tests for onboarding, recs, case creation, export.
- **Dashboards:** rec quality (P@5, nDCG@10), ATS parse rate, latency (P50/P95 for /recommendations), dedupe %, scrape success rate.
- **Alerts:** rec latency > 60s, ATS parse success &lt; 95%, dedupe &gt; 10%, connector error spikes.
- **Drift:** monitor embedding vector norms & sim distributions; alert on shifts.

## 20.9 Deployment & Ops

- **Envs:** dev, staging, prod. Blue/green deploys for API; canary for ranker.
- **Scaling:** API horizontally; workers per queue; connectors time‑boxed; rate‑limit per user.
- **CDN:** static assets + pre‑signed download links; no public resume URLs.
- **Feature flags:** DB‑backed for weights, presets, connector toggles.

## 20.10 Failure & Retry Semantics

- **Idempotency:** all write endpoints accept Idempotency-Key to de‑dupe retries.
- **Retries:** network/429/5xx with jittered backoff; DLQ for poisoned messages.
- **Partial failure UX:** surface per‑rec errors; allow manual JD paste as fallback.

## 20.11 Quotas & Cost Controls

- Per‑user daily caps: recommendations, resume variants, outreach drafts. Batch embeddings; cache popular postings; decay old vectors.
- Cost dashboard: LLM tokens, embedding calls, export CPU minutes.

## 20.12 Intl & Edge Cases

- **Locales:** date parsing (MMM YYYY), number formats, currency normalization. Time‑zone aware events.
- **Languages:** accept non‑English resumes/JDs; fallback to English embeddings via translation model (feature‑flagged).
- **Remote/hybrid/on‑site:** classifier from JD text + company policy heuristics.

## 21) MVP Wireframes (text)

Low‑fi wireframes in text for speed and unambiguous specs. These define **layout, states, and events** so we can build quickly without pixel comps. Visual polish can layer on later.

### 21.1 Recommendations (Reverse Headhunter) — List View

\`\`\`

\[Top Bar\]

┌────────────────────────────────────────────────────────────────────────────┐

│ Riva ▸ Recommendations \[Persona: ◄ Conservative — Bold ►\] │

│ Filters: \[Location ▾\] \[Level ▾\] \[Remote/Hybrid/On‑site ▾\] \[Capabilities ▾\] │

│ \[Industries ▾\] \[Comp floor $ ▾\] \[Seen: All ▾\] (☑ Exclude applied) │

│ Sort: (● Best match ○ Newest ○ Why‑now) (Search 🔎 optional) │

└────────────────────────────────────────────────────────────────────────────┘

\[Rec Card × N\]

┌────────────────────────────────────────────────────────────────────────────┐

│ \[Title\] Senior Platform Engineer \[Company\] Acme Robotics │

│ \[Location\] NYC • Hybrid \[Level\] IC6 \[Score\] 0.84 \[Confidence\] High │

│ Chips: Capabilities(Platform, LLM Infra) Industries(TMT) │

│ Why this fit: “You led LLM eval/infra and ran 24/7 platform on Kubernetes.”│

│ Why now: Series C $60M (Aug 1, 2025) • New VP Eng (Jul 2025) │

│ Evidence: \[Resume ▸ “LLM eval suite, 98% recall”\] \[JD ▸ “model QA”\] │

│ Gates: ☑ Work auth ☑ Seniority ☑ Location ☒ Must‑have: GCP cert │

│ Actions: \[Open\] \[Hide\] \[Save\] \[Quick Create Case\] │

└────────────────────────────────────────────────────────────────────────────┘

\[Pagination/Load more\] • \[Empty state if 0 matches: “Tighten filters or edit profile”\]

\`\`\`

### States

- **Loading**: 8 skeleton cards, shimmer.
- **Empty**: friendly explainer + “Broaden filters” + “Edit Intent Profile”.
- **Error (per‑rec)**: inline banner on card with retry; list continues to render.

### Keyboard / A11y

- ↑/↓ to move focus across cards; Enter = Open; H = Hide; S = Save; C = Quick Create Case.
- All chips and actions tabbable; tooltips read by screen readers; badges have aria‑labels.

### Tracking (events)

- recs_rendered, rec_impression, rec_opened, rec_hidden, rec_saved, quick_case_created, filter changes, sort changes, search.

### 21.2 Recommendation Details — “Why this fit” Modal

\`\`\`

┌────────────────────────────────────────────────────────────────────────────┐

│ \[Company • Title • Location • Level\] \[Score 0.84 | High conf\] │

│ Why now: Series C $60M (Aug 1, 2025) • New VP Eng (Jul 2025) │

├────────────────────────────────────────────────────────────────────────────┤

│ Left: JD Preview (scroll)

│ ┌───────────────────────────────────────────────────────────────────────┐

│ │ JD text with highlights on matched lines (L12, L23, L41). │

│ │ Toggles: \[Show matched only\] \[Show all\] │

│ └───────────────────────────────────────────────────────────────────────┘

│ Right: Match Explanation + Actions

│ ┌───────────────────────────────────────────────────────────────────────┐

│ │ Evidence table │

│ │ JD Requirement Resume Evidence Confidence │

│ │ ─────────────────────────────────────────────────────────────────── │

│ │ “Model QA & eval” “Built LLM eval suite (98%… )” High │

│ │ “Platform SRE exp” “Owned 24/7 on‑call, MTTR→18m” Med │

│ │ “GCP cert” — Suggested line (add or reword) Low │

│ └───────────────────────────────────────────────────────────────────────┘

│ \[Comp estimate ▸ P10/P50/P90\] \[Persona ▸ Exec/IC slider\]

│ Primary CTA: \[Generate ATS Resume Variant\] Secondary: \[Draft Outreach\]

│ Tertiary: \[Create Case (empty artifacts)\] \[Hide\] \[Save\]

└────────────────────────────────────────────────────────────────────────────┘

\`\`\`

### Post‑CTA flow

1. Generate ATS variant → show **Diff View** (left: original, right: variant; additions green, removals red).
2. \[Accept changes\] → enable \[Create Case\] (selected role pre‑attached).
3. Case created → toast with links: \[View Case\] \[Copy Outreach\] \[Set Follow‑up\].

### Tracking

- rec_detail_opened, variant_generated, variant_diff_viewed, variant_accepted, case_created_from_rec, outreach_drafted.

### Perf targets

- Modal open ≤ 200ms; variant generation P50 ≤ 15s, P95 ≤ 30s; comp estimate ≤ 500ms (cached)

### 21.3 Case — Minimal Page (after creation)

\`\`\`

\[Header\] Company • Title • Location • Status: Applied ▾ \[Follow‑up due: Aug 20\]

Left: Artifacts

\- Resume v2 (ATS) \[Download DOCX\] \[Download PDF\] \[Open diff\]

\- Outreach v1 (Exec tone) \[Copy\] \[Edit\]

\- Notes \[Add\]

Right: Scorecard & Evidence

\- Overall 0.82 | Capability 0.78 | Industry 0.70 | Must‑haves 3/4

\- Evidence chips (expand to table)

\- “What’s missing” checklist (e.g., GCP cert)

Footer: Timeline (events), Labels (Gmail), Delete Case

\`\`\`

**Tracking**: case_viewed, artifact_downloaded, outreach_copied, followup_set.

## 22) UI ↔ API Data Contracts (front‑end)

### 22.1 RecommendationCard

\`\`\`json

{

"job_posting_id": "uuid",

"title": "Senior Platform Engineer",

"company": "Acme Robotics",

"location": "NYC • Hybrid",

"level": "IC6",

"score": 0.84,

"confidence": "high",

"capabilities": \["Platform", "LLM Infra"\],

"industries": \["TMT"\],

"why_this_fit": "You led LLM eval/infra and ran 24/7 platform…",

"why_now": \[{"type":"funding","label":"Series C $60M","date":"2025-08-01"}, {"type":"exec_hire","label":"New VP Eng","date":"2025-07-10"}\],

"evidence": \[

{"kind":"resume","text":"LLM eval suite, 98% recall","ref":"resume:projects:3"},

{"kind":"jd","text":"model QA","ref":"jd:L23"}

\],

"gates": {"work_auth": true, "seniority": true, "location": true, "must_haves": \["gcp_cert:false"\]}

}

\`\`\`

### 22.2 EvidenceRow (modal table)

\`\`\`json

{"jd_req":"Model QA & eval","resume_evidence":"Built LLM eval suite (98%…)","confidence":"high","suggested_line":"Add ‘GCP cert (in progress)’ to Skills"}

\`\`\`

### 22.3 CreateCaseRequest

\`\`\`json

{"job_posting_id":"uuid","artifacts":{"resume_variant_id":"uuid","outreach_md":"…"}}

\`\`\`

## 23) UX Copy Guidelines (micro‑copy)

- **Why this fit**: 1–2 sentences, present‑tense, specific metric if available.
- **Why now**: terse signal + date; show newest first; hide if >120 days old unless user pins.
- **Gates**: use plain language; show fix paths (“Add GCP cert to skills”).
- **Errors**: apologize once; offer useful next action (retry, switch to manual JD paste).

## 24) Edge Cases & States

- **Duplicates across sources**: collapse; allow expand to see origins.
- **Stale postings**: de‑rank; gray badge “Older posting.”
- **Confidential resumes**: strict anonymization mode; block export if client names detected.
- **Low‑signal profiles**: suggest profile enrich (skills, achievements) before showing full list.
- **Hard gates failed**: card shows reason; “Hide similar” quick action.
- **Network blips**: keep list; retry badges per card; global offline banner.

## 25) Analytics & Dashboards (MVP)

- **Quality**: P@5, nDCG@10 (by cohort), accept→apply %, duplicate %, stale %, coverage %.
- **Funnel**: impressions → opens → variant → case → outreach → reply → screen → onsite.
- **Latency**: /recommendations P50/P95, variant gen P50/P95, comp estimate.
- **Connector health**: fetch success rate, timeouts, robots blocks.