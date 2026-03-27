# Riva — Career Dashboard & Copilot Chat Spec

**Version:** v0.1\
**Date:** Aug 16, 2025\
**Owner:** Devin\
**Purpose:** Define a retention‑oriented **Career Dashboard** and an integrated **Copilot Chat** that transform job search from ad‑hoc tracking into a proactive, data‑driven pipeline with execution actions.

> BLUF — Ship a dashboard that auto‑tracks the funnel, surfaces **Next Best Actions**, overlays **Company Intelligence**, and embeds a **Copilot Chat** that answers strategic questions *and* executes: apply, intro, follow‑up, generate resume variants, simulate pivots, and evaluate offers.

______________________________________________________________________

## 1) Product Goals & Non‑Goals

**Goals**

- Make progress **visible**: end‑to‑end funnel with conversion and time‑in‑stage.
- Make progress **inevitable**: guided **Next Best Actions** with one‑click execution.
- Provide **context**: company intel + market signals, personalized to user trajectory.
- Build **trust**: evidence chips (sources + freshness); privacy controls.

**Non‑Goals**

- Full CRM replacement for enterprise recruiting.
- Public social graph features (e.g., shared leaderboards).

______________________________________________________________________

## 2) Target Users & JTBD

- **Senior ICs (Sr Consultant/Staff/Principal)** — optimize interview rate, discover high‑fit roles, tighten storytelling.
- **Execs (Mgr→Director→VP)** — track inbound/outbound pipeline, intel on target companies, offer strategy.

**Jobs To Be Done**

- “Show me where I’m stuck and what to do next.”
- “Tell me which companies I should pursue *and why now*.”
- “If I pivot roles, what’s the plan and the risk?”
- “Which resume/outreach variant actually works?”

______________________________________________________________________

## 3) UX Overview

**Layout (desktop)**

- **Header:** Active profile badge (local/dev/staging/prod), week selector, export.
- **Left column:** **Funnel** (Sourced→Shortlisted→Applied→Interview→Offer→Accepted) + **Conversion** and **Aging alerts**.
- **Center column:** **Next Best Actions** (3–5 items) with action chips (Apply, Follow‑up, Generate Variant, Request Intro, Schedule Mock).
- **Right column:** **Opportunity Radar** (new matches + exploration picks) and **Company Intel Cards** (watchlist & inferred).
- **Bottom row:** **Outcome Analytics** (variant performance, send timing, channel win‑rates) + **Skill Gap Radar** and **Story Bank** quick access.
- **Persistent sidebar:** **Copilot Chat** with memory and action buttons.

**Mobile**: stacked cards; chat as slide‑up drawer; sticky “Next Action”.

______________________________________________________________________

## 4) Widgets (MVP → vNext)

### 4.1 Funnel & Conversion

- Metrics: counts, conversion %, time‑in‑stage, SLA alerts (e.g., >7 days in Shortlisted).
- Filters: role type, geo, seniority, company list.

### 4.2 Next Best Actions

- Types: follow‑ups due, ghosted threads, generate ATS variant, send outreach, book mock, add watchlist target, networking intro.
- Each action shows **evidence chips** (e.g., “Open rate 42% for this persona”); one‑click execution with undo.

### 4.3 Opportunity Radar

- New matches from sourcing agents; **exploration ε** picks with rationale.
- Show fit score, trajectory fit, comp inference range.

### 4.4 Company Intel Cards

- Signals: hiring velocity proxy, recent postings, funding/events, leadership changes, culture/interview notes, comp bands.
- Actions: Follow, Generate outreach, Add to shortlist, Ask Copilot about company.

### 4.5 Outcome Analytics

- Variant performance: resume/outreach versions → interviews/offers.
- Channel analysis: referral vs cold email vs portal.

### 4.6 Skill Gap Radar (vNext)

- Diff vs target roles; 90‑day upskilling plan with micro‑projects.

### 4.7 Story Bank (vNext)

- Indexed STAR/SPI stories mapped to competencies; quick insert into outreach.

______________________________________________________________________

## 5) Copilot Chat

**Positioning:** Execution‑centric assistant with memory.

**Core Capabilities (Tools)**

- `find_opportunities(profile|constraints)` → list with evidence chips.
- `compute_fit(resume, role/company)` → alignment, gaps, phrasing suggestions.
- `generate_resume_variant(role)` → ATS‑safe variant.
- `generate_outreach(company|recruiter)` → 120–160 word emails with tone presets.
- `follow_up(thread_id)` → draft + send via inbox integration.
- `schedule_mock(round_type)` → create mock session.
- `simulate_trajectory(pivot)` → feasibility + 90‑day plan.
- `analyze_company(company)` → intel card, sources, freshness.
- `evaluate_offer(offer_json)` → score + negotiation scripts.
- `map_network(company)` → intro paths + drafted messages.

**Response Pattern:** BLUF → short reasoning → **Action chips** (apply, intro, generate, follow‑up, add to watchlist) → **Evidence chips** (sources, freshness, confidence).

**Memory:** long‑term user profile, resumes/variants, watchlist, preferences; session state with current focus.

______________________________________________________________________

## 6) KPIs & Success Criteria

- **Primary:** Interviews per week; Offer rate; Apply→Interview conversion; Time‑to‑first‑interview.
- **Engagement:** WAU/MAU; actions per session; % users completing ≥1 Next Action/week.
- **Quality:** Evidence coverage rate; data freshness; abstention on low confidence.

**Targets (MVP):**

- +20–30% apply→interview vs pre‑dashboard baseline.
- ≥80% of active users act on ≥1 Next Action per week.

______________________________________________________________________

## 7) Data Model (additions)

```sql
-- Applications
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  company_id uuid REFERENCES companies(id),
  role text NOT NULL,
  source text,          -- referral|portal|email
  stage text NOT NULL,  -- sourced|shortlisted|applied|interview|offer|accepted|rejected
  confidence numeric,   -- 0..1 fit score snapshot
  stage_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Application events
CREATE TABLE application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id),
  event_type text NOT NULL,  -- stage_changed|follow_up_sent|interview_scheduled|offer_received|note
  ts timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

-- Company profiles + signals
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE,
  name text NOT NULL
);
CREATE TABLE company_signals (
  company_id uuid NOT NULL REFERENCES companies(id),
  signals_json jsonb NOT NULL,
  refreshed_at timestamptz NOT NULL,
  PRIMARY KEY(company_id, refreshed_at)
);

-- Watchlist
CREATE TABLE company_watchlist (
  user_id uuid NOT NULL REFERENCES users(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, company_id)
);

-- Offers
CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  company_id uuid REFERENCES companies(id),
  cash numeric, equity jsonb, benefits jsonb, vesting jsonb,
  notes text, evaluated_at timestamptz, score numeric
);

-- Story Bank (vNext)
CREATE TABLE story_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  competency text, bullets jsonb, metrics jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Materialized views**

```sql
CREATE MATERIALIZED VIEW user_kpis AS
SELECT a.user_id,
  date_trunc('week', now()) AS as_of,
  SUM(CASE WHEN stage='interview' THEN 1 ELSE 0 END) FILTER (WHERE a.created_at > now() - interval '7 days') AS interviews_week,
  AVG(CASE WHEN stage='offer' THEN 1 ELSE 0 END)::numeric AS offer_rate,
  AVG(CASE WHEN stage IN ('applied','shortlisted') AND EXISTS (
    SELECT 1 FROM application_events e WHERE e.application_id=a.id AND e.event_type='stage_changed' AND (e.metadata->>'to')='interview')
  THEN 1 ELSE 0 END)::numeric AS apply_to_interview_rate
FROM applications a
GROUP BY a.user_id;
```

______________________________________________________________________

## 8) Events & Instrumentation

- `recommendation_viewed`, `recommendation_applied`
- `email_followup_sent`, `interview_scheduled`, `ghosting_alert_shown`
- `stage_changed:{applied|screen|onsite|offer|accepted|rejected}`
- `company_followed`, `company_card_opened`
- `chat_action:{apply|intro|followup|variant|analyze|simulate|negotiate}`

Each event captures: `user_id`, `request_id`, `profile_used`, `trace_id`, `latency_ms`, `evidence_coverage`.

______________________________________________________________________

## 9) Copilot Tools — Contracts (JSON)

```ts
// Find opportunities
POST /copilot/find_opportunities
Req:  { profile_id?: string, constraints?: { geo?: string[], level?: string[], remote?: 'onsite'|'hybrid'|'remote', comp_floor?: number } }
Res:  { items: Array<{ id: string, company: string, role: string, fit: number, rationale: string[], sources: SourceChip[], actions: ActionChip[] }>, as_of: string }

// Compute fit
POST /copilot/compute_fit
Req:  { resume_id: string, target: { role?: string, company?: string, jd_url?: string } }
Res:  { score: number, gaps: string[], phrasing: string[], evidence: SourceChip[] }

// Generate resume variant
POST /copilot/generate_resume_variant
Req:  { resume_id: string, role: string, tone?: 'exec'|'concise' }
Res:  { variant_id: string, ats_pass_pred: number, download_url: string }

// Generate outreach
POST /copilot/generate_outreach
Req:  { company: string, contact?: string, resume_id?: string, tone?: 'exec'|'warm'|'direct' }
Res:  { subject: string, body: string, tokens: number }

// Follow-up
POST /copilot/follow_up
Req:  { thread_id: string, style?: 'polite'|'direct' }
Res:  { draft: string, scheduled_at?: string }

// Analyze company
POST /copilot/analyze_company
Req:  { company: string }
Res:  { summary: string, signals: any, freshness: string, sources: SourceChip[] }

// Simulate trajectory
POST /copilot/simulate_trajectory
Req:  { from_role: string, to_role: string, constraints?: any }
Res:  { feasibility: number, plan_90d: string[], risks: string[] }

// Evaluate offer
POST /copilot/evaluate_offer
Req:  { offer: any }
Res:  { score: number, notes: string[], negotiation_scripts: string[] }
```

`SourceChip = { label: string, url?: string, fetched_at: string }`\
`ActionChip = { type: 'apply'|'intro'|'followup'|'variant'|'watch'|'analyze', payload?: any }`

______________________________________________________________________

## 10) API Surface (Dashboard)

```http
GET  /dashboard/funnel?week=YYYY-WW
GET  /dashboard/next-actions
GET  /dashboard/opportunity-radar
GET  /dashboard/company-intel?company_id=...
GET  /dashboard/outcome-analytics
POST /dashboard/watchlist { company_id }
```

All endpoints tag runs with `profile_used`, `request_id`, and `trace_id` (via unified tracer). Connects to Operator Console for replays/A‑B.

______________________________________________________________________

## 11) Data Freshness & SLAs

- Company signals refresh: 24–72h; show **freshness chip** and abstain if >7d.
- Inbox/ATS polling: every 5–15m (user‑configurable), with manual refresh.
- Radar ingestion: hourly for priority sources; daily for long‑tail.

______________________________________________________________________

## 12) Privacy & Consent

- Least‑privilege OAuth scopes for inbox/calendar; explicit on‑screen consent.
- Redaction presets (standard/strict) applied to stored artifacts.
- Evidence chips always show source and timestamp; block opaque claims.

______________________________________________________________________

## 13) Risks & Mitigations

- **Hallucinations** → require evidence; abstain low confidence; allow “Flag” feedback.
- **Over‑automation** → user confirmation gates; undo and audit log.
- **Data gaps** → abstain with suggested manual next action.
- **Scope creep** → ship MVP widgets first; vNext adds Skill Gap & Story Bank.

______________________________________________________________________

## 14) Rollout Plan (3 sprints)

**Sprint 1 (POC chat + core widgets)**

- Funnel, Next Actions (follow‑ups, variant gen), Opportunity Radar (top sources).
- Copilot tools: `find_opportunities`, `compute_fit`, `generate_outreach`, `generate_resume_variant`.
- Events + KPIs materialized view.

**Sprint 2 (intel + network)**

- Company Intel Cards with freshness/evidence chips; watchlist.
- Copilot `analyze_company`, `map_network` (stub intros via email).
- Weekly digest email.

**Sprint 3 (offers + pivots + gap radar)**

- Offers model + evaluator + negotiation scripts.
- `simulate_trajectory` + starter Skill Gap Radar.

______________________________________________________________________

## 15) Acceptance Criteria (MVP)

- Dashboard loads ≤1.5s P95 (cached) with week funnel + next actions.
- Each copilot response ends with ≥1 actionable chip and ≥1 evidence chip.
- ≥90% ATS variants pass fixture suite.
- KPI uplift observable on test cohort: +20% apply→interview.

______________________________________________________________________

## 16) Tech Notes & Integration

- **Unified tracer** (LangSmith in dev, Langfuse in staging/prod) labels: `feature=dashboard|copilot`, `profile_used`.
- **Operator Console hooks:** `/ops/run` and `/ops/replay` available for A/B of prompt packs and ranker weights; dashboard endpoints add `run_config_id` for reproducibility.
- **Profiles:** honor `.riva-profile` + `riva.toml`; show active profile badge.

______________________________________________________________________

## 17) Future Enhancements

- Networking graph with inferred second‑degree paths.
- Calendar‑aware cadence optimizer for outreach/follow‑ups.
- Live market pulse: titles trending up/down, compensation drift.
- Playbooks: bundles of actions (e.g., “Director‑track push, 14‑day plan”).
