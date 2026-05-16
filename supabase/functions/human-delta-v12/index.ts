// Human Delta™ V12.4 "Forensic" Autonomous Report Engine
// Direct Gemini API call → strict 15-section JSON schema → save to temr_audit_logs.
// Runtime: Deno (Supabase Edge Function).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { encode as encodeHex } from 'https://deno.land/std@0.168.0/encoding/hex.ts';
import { V12_SYSTEM_INSTRUCTIONS } from '../_shared/v12-system-prompt.ts';

declare const Deno: { env: { get(name: string): string | undefined } };

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/json; charset=utf-8' };

const SYSTEM_INSTRUCTIONS = V12_SYSTEM_INSTRUCTIONS;

function phaseSchema() {
  return {
    type: 'object',
    properties: {
      Focus: { type: 'string' },
      Human_Shift: { type: 'string' },
      AI_Lever: { type: 'string' },
    },
    required: ['Focus', 'Human_Shift', 'AI_Lever'],
  };
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    SEC_00_Metadata: {
      type: 'object',
      properties: {
        Archetype: { type: 'string' },
        Delta_Score: { type: 'number' },
        Anchor_Signal: { type: 'string' },
      },
      required: ['Archetype', 'Delta_Score', 'Anchor_Signal'],
    },
    SEC_01_Executive_Signal: {
      type: 'object',
      properties: {
        Headline: { type: 'string' },
        Critical_Insight: { type: 'string' },
        Subsidisation_Alert: { type: 'string' },
        Long_Term_Cost: { type: 'string' },
      },
      required: ['Headline', 'Critical_Insight', 'Subsidisation_Alert', 'Long_Term_Cost'],
    },
    SEC_01_5_Archetype_Diagnostic: {
      type: 'object',
      properties: {
        Headline: { type: 'string' },
        Strength_As_Brake: { type: 'string' },
      },
      required: ['Headline', 'Strength_As_Brake'],
    },
    SEC_02_90_Second_Summary: {
      type: 'object',
      properties: {
        State: { type: 'string' },
        Barrier: { type: 'string' },
        Pivot: { type: 'string' },
      },
      required: ['State', 'Barrier', 'Pivot'],
    },
    SEC_03_06_Forensic_Diagnoses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          Section_ID: { type: 'string' },
          Title: { type: 'string' },
          Mechanism: { type: 'string' },
          Observable: { type: 'string' },
          Performance_Tax: { type: 'string' },
          The_Win: { type: 'string' },
        },
        required: ['Section_ID', 'Title', 'Mechanism', 'Observable', 'Performance_Tax', 'The_Win'],
      },
    },
    SEC_07_Dynamic_Calibration: {
      type: 'object',
      properties: {
        Abandon: { type: 'array', items: { type: 'string' } },
        Gain: { type: 'array', items: { type: 'string' } },
        Trade_Pairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              Let_Go_Of_Headline: { type: 'string' },
              Let_Go_Of_Body: { type: 'string' },
              You_Gain_Headline: { type: 'string' },
              You_Gain_Body: { type: 'string' },
            },
            required: ['Let_Go_Of_Headline', 'Let_Go_Of_Body', 'You_Gain_Headline', 'You_Gain_Body'],
          },
        },
      },
      required: ['Abandon', 'Gain', 'Trade_Pairs'],
    },
    SEC_08_Asset_Audit: {
      type: 'object',
      properties: {
        Intro: { type: 'string' },
        Yield_Leak_Warnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              Trait_Name: { type: 'string' },
              Score: { type: 'number' },
              Warning: { type: 'string' },
            },
            required: ['Trait_Name', 'Score', 'Warning'],
          },
        },
      },
      required: ['Intro', 'Yield_Leak_Warnings'],
    },
    SEC_09_Behavioural_Audit: {
      type: 'object',
      properties: {
        Forensic_Traits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              Trait_Name: { type: 'string' },
              Score: { type: 'number' },
              Diagnosis: { type: 'string' },
              Strategic_Yield: { type: 'string' },
              Monday_Script: { type: 'string' },
            },
            required: ['Trait_Name', 'Score', 'Diagnosis', 'Strategic_Yield', 'Monday_Script'],
          },
        },
      },
      required: ['Forensic_Traits'],
    },
    SEC_10_90_Day_Pivot: {
      type: 'object',
      properties: {
        Phase_1_Analyst: phaseSchema(),
        Phase_2_Designer: phaseSchema(),
        Phase_3_Architect: phaseSchema(),
      },
      required: ['Phase_1_Analyst', 'Phase_2_Designer', 'Phase_3_Architect'],
    },
    SEC_11_Investment_Thesis: {
      type: 'object',
      properties: {
        Status_of_Asset: { type: 'string' },
        Cost_of_Tactical_Fires: { type: 'string' },
        Redeployment_Recommendation: { type: 'string' },
      },
      required: ['Status_of_Asset', 'Cost_of_Tactical_Fires', 'Redeployment_Recommendation'],
    },
    SEC_12_90_Day_Command: {
      type: 'object',
      properties: {
        Velocity_Metric: { type: 'string' },
        Command: { type: 'string' },
      },
      required: ['Velocity_Metric', 'Command'],
    },
    SEC_13_The_Choice: {
      type: 'object',
      properties: { The_Binary_Sting: { type: 'string' } },
      required: ['The_Binary_Sting'],
    },
    SEC_14_Notice_of_Plasticity: {
      type: 'object',
      properties: {
        Body: { type: 'string' },
        Why_Habits_Take_Time: { type: 'string' },
        What_Three_Months_Feel_Like: { type: 'string' },
        The_Warning: { type: 'string' },
      },
      required: ['Body', 'Why_Habits_Take_Time', 'What_Three_Months_Feel_Like', 'The_Warning'],
    },
    SEC_15_Plasticity_Notice: {
      type: 'object',
      properties: {
        Nature: { type: 'string' },
        Non_Clinical_Status: { type: 'string' },
        Neuroplasticity_Principle: { type: 'string' },
      },
      required: ['Nature', 'Non_Clinical_Status', 'Neuroplasticity_Principle'],
    },
  },
  required: [
    'SEC_00_Metadata',
    'SEC_01_Executive_Signal',
    'SEC_01_5_Archetype_Diagnostic',
    'SEC_02_90_Second_Summary',
    'SEC_03_06_Forensic_Diagnoses',
    'SEC_07_Dynamic_Calibration',
    'SEC_08_Asset_Audit',
    'SEC_09_Behavioural_Audit',
    'SEC_10_90_Day_Pivot',
    'SEC_11_Investment_Thesis',
    'SEC_12_90_Day_Command',
    'SEC_13_The_Choice',
    'SEC_14_Notice_of_Plasticity',
    'SEC_15_Plasticity_Notice',
  ],
};

interface RawAnswer { id: number; pillar: string; trait: string; value: number; reverse: boolean; }
interface ScoredAnswer extends RawAnswer { scored: number; }

interface RequestBody {
  paymentToken?: string;
  assessmentId?: string;
  clientName: string;
  position?: string;
  ageRange?: string;
  experienceRange?: string;
  experienceYears?: number;
  gender?: string;
  industry?: string;
  answers: RawAnswer[];
  pillarLabels?: Record<string, string>;
}

(globalThis as any).Deno?.serve?.(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const paymentToken = body.paymentToken;
  if (!paymentToken) return json({ error: 'Payment required' }, 402);
  const tokenOk = await verifyPaymentToken(paymentToken, body.assessmentId ?? null);
  if (!tokenOk) return json({ error: 'Payment token invalid or expired' }, 402);

  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return json({ error: 'answers array required' }, 400);
  }

  const scored: ScoredAnswer[] = body.answers.map((a) => ({
    ...a,
    scored: a.reverse ? 6 - a.value : a.value,
  }));

  const pillarScores = computePillarScores(scored);
  const overall = Math.round(
    Object.values(pillarScores).reduce((s, v) => s + v, 0) / 4,
  );
  const ranked = (['T', 'E', 'M', 'R'] as const)
    .map((p) => ({ p, s: pillarScores[p] }))
    .sort((a, b) => b.s - a.s);
  const primary = ranked[0].p;
  const secondary = ranked[1].p;
  const lowest = ranked[3].p;
  const archetype = ARCHETYPE_MATRIX[`${primary}|${secondary}`] ?? 'The Operator';
  const tierLevel = overall >= 80 ? 'Tier 1: Architect'
    : overall >= 65 ? 'Tier 2: Operator'
    : overall >= 45 ? 'Tier 3: Solver'
    : 'Tier 4: Subsidiser';

  const traitMap = new Map<string, { sum: number; count: number; pillar: string }>();
  for (const a of scored) {
    const key = a.trait || `${a.pillar}-${a.id}`;
    const cur = traitMap.get(key) ?? { sum: 0, count: 0, pillar: a.pillar };
    cur.sum += a.scored;
    cur.count += 1;
    traitMap.set(key, cur);
  }
  const traits = [...traitMap.entries()].map(([name, v]) => ({
    name,
    pillar: v.pillar,
    score: Math.round(((v.sum / v.count - 1) / 4) * 100),
  }));

  const userPrompt = buildUserPrompt({
    body, overall, pillarScores, primary, secondary, lowest, archetype, tierLevel, traits,
  });

  // GDPR/PII: build a sanitised copy of the prompt for the audit row so
  // we never persist the reader's real name. The LLM still receives the
  // unredacted prompt above (the narrative needs to address them by
  // name), but the only thing we keep on disk is name-free.
  const userPromptForAudit = (() => {
    const name = body.clientName ?? "";
    if (!name) return userPrompt;
    // Escape regex metacharacters, then strip every occurrence of the name.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return userPrompt.replace(new RegExp(escaped, "g"), "[REDACTED-NAME]");
  })();

  const geminiKey = Deno.env.get('GOOGLE_API_KEY') ?? Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-pro';
  if (!geminiKey) return json({ error: 'GOOGLE_API_KEY not configured' }, 500);

  const startedAt = Date.now();
  let llmRaw = '';
  let parsed: unknown = null;
  let parseError: string | null = null;
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.7,
            maxOutputTokens: 24576,
          },
        }),
      },
    );
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Gemini HTTP ${resp.status}: ${t.slice(0, 500)}`);
    }
    const data = await resp.json();
    llmRaw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!llmRaw) throw new Error('Empty response from Gemini');
    parsed = JSON.parse(llmRaw);
  } catch (err) {
    parseError = (err as Error).message;
    console.error('[human-delta-v12] Gemini error:', parseError);
  }
  const latencyMs = Date.now() - startedAt;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    await supabase.from('temr_audit_logs').insert({
      session_id: body.assessmentId ?? null,
      status: parseError ? 'failed' : 'completed',
      system_prompt_version: 'v12.4-mentor',
      demographics: {
        gender: body.gender ?? null,
        ageRange: body.ageRange ?? null,
        experienceRange: body.experienceRange ?? null,
        industry: body.industry ?? null,
        position: body.position ?? null,
        // GDPR/PII: do NOT persist the reader's name on the audit row.
        // The name is a direct identifier and lives only inside the
        // rendered narrative returned to the caller.
      },
      raw_responses: body.answers,
      computed_scores: pillarScores,
      trait_scores: traits,
      archetype,
      primary_pillar: primary,
      secondary_pillar: secondary,
      lowest_pillar: lowest,
      user_prompt_full: userPromptForAudit,
      llm_model: model,
      llm_output_raw: llmRaw,
      llm_parse_success: !parseError,
      llm_parse_error: parseError,
      total_duration_ms: latencyMs,
      output_validated: !parseError,
      report_delivered: !parseError,
    });
  } catch (auditErr) {
    console.error('[human-delta-v12] audit log failed:', (auditErr as Error).message);
  }

  if (parseError || !parsed) {
    // Don't leak LLM error bodies to the client — server logs retain detail.
    return json({ error: 'Report generation failed' }, 502);
  }

  return json({
    report: parsed,
    meta: {
      pillarScores, overall, archetype, primary, secondary, lowest, tierLevel, latencyMs, model,
      clientName: body.clientName,
      industry: body.industry ?? null,
    },
  });
});

function computePillarScores(scored: ScoredAnswer[]): Record<'T' | 'E' | 'M' | 'R', number> {
  const buckets: Record<string, number[]> = { T: [], E: [], M: [], R: [] };
  for (const a of scored) if (a.pillar in buckets) buckets[a.pillar].push(a.scored);
  const out: Record<'T' | 'E' | 'M' | 'R', number> = { T: 0, E: 0, M: 0, R: 0 };
  for (const k of ['T', 'E', 'M', 'R'] as const) {
    const arr = buckets[k];
    if (arr.length === 0) { out[k] = 0; continue; }
    const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
    out[k] = Math.round(((avg - 1) / 4) * 100);
  }
  return out;
}

const ARCHETYPE_MATRIX: Record<string, string> = {
  'T|E': 'The Precision Executor', 'T|M': 'The Strategic Operator', 'T|R': 'The Reliable Anchor',
  'E|T': 'The Composed Performer', 'E|M': 'The Adaptive Thinker', 'E|R': 'The Empathetic Leader',
  'M|T': 'The Systems Architect', 'M|E': 'The Strategic Navigator', 'M|R': 'The Vision Builder',
  'R|T': 'The Connected Executor', 'R|E': 'The Resilient Connector', 'R|M': 'The High-Impact Connector',
};

const PILLAR_FULL: Record<string, string> = { T: 'Tactical', E: 'Emotional', M: 'Mental', R: 'Relational' };

function buildUserPrompt(args: {
  body: RequestBody;
  overall: number;
  pillarScores: Record<string, number>;
  primary: string;
  secondary: string;
  lowest: string;
  archetype: string;
  tierLevel: string;
  traits: Array<{ name: string; pillar: string; score: number }>;
}): string {
  const { body, overall, pillarScores, primary, secondary, lowest, archetype, tierLevel, traits } = args;
  const sortedTraits = [...traits].sort((a, b) => a.score - b.score);
  const traitLines = sortedTraits
    .map((t) => `  - ${t.name} (${PILLAR_FULL[t.pillar] ?? t.pillar}): ${t.score}/100`)
    .join('\n');
  const highTraits = [...traits].sort((a, b) => b.score - a.score).slice(0, 3)
    .map((t) => `  - ${t.name}: ${t.score}/100`).join('\n');

  return `Generate the Human Delta V12.4 "Human Mentor" leadership report for this reader. Plain English only. No jargon. No em dashes, en dashes, slashes, or ampersands.

=== CLIENT IDENTITY ===
Name:        ${body.clientName}
Position:    ${body.position ?? 'Not specified'}
Industry:    ${body.industry ?? 'Not specified'}
Age:         ${body.ageRange ?? 'Not specified'}
Gender:      ${body.gender ?? 'Not specified'}
Experience:  ${body.experienceRange ?? (body.experienceYears != null ? `${body.experienceYears}y` : 'Not specified')}

=== AUDIT SCORES (0-100) ===
Overall Human Delta:  ${overall}/100   →  Tier: ${tierLevel}
Tactical (T):  ${pillarScores.T}     Emotional (E): ${pillarScores.E}
Mental   (M):  ${pillarScores.M}     Relational (R): ${pillarScores.R}

Primary pillar:   ${PILLAR_FULL[primary]}
Secondary pillar: ${PILLAR_FULL[secondary]}
Weakest pillar:   ${PILLAR_FULL[lowest]}
Archetype:        ${archetype}

=== TRAIT-LEVEL DIAGNOSTICS (lowest first) ===
${traitLines}

=== HIGHEST-SCORING TRAITS (for SEC_08 yield-leak warnings) ===
${highTraits}

=== INSTRUCTIONS. Generate ALL 13 keyed sections (15 logical sections) ===
- SEC_00_Metadata: Archetype="${archetype}", Delta_Score=${overall}, Anchor_Signal = a 6 to 10 word plain English phrase that captures this reader.
- SEC_01_Executive_Signal (The Big Picture): Headline (one sentence). Critical_Insight (explain that the reader's hard work is acting as a shield for the team, meaning they are working longer hours to cover for a lack of clear team processes). Subsidisation_Alert (despite the field name, write it in plain English: name the specific places where the reader is using personal effort to make up for missing team processes). Long_Term_Cost (3 to 4 sentences explaining how trading future career growth for today's tactical stability quietly makes the reader too essential to be promoted, so the very reliability that earned them this seat is the reason they stay in it).
- SEC_01_5_Archetype_Diagnostic (The Growth Hurdle): Headline plus Strength_As_Brake. Explain why being the best person at doing the work is now the main obstacle to becoming a senior leader.
- SEC_02_90_Second_Summary: three plain sentences. State (where the reader is now). Barrier (the hurdle they face). Pivot (the shift they need to make).
- SEC_03_06_Forensic_Diagnoses: EXACTLY 4 items, one per bottleneck. Use Section_IDs "SEC_03","SEC_04","SEC_05","SEC_06" and Titles in this exact order: "Decision Fatigue", "The Permission Trap", "Recurring Fires", "The Visibility Gap". For each item, fill all four fields in plain English: Mechanism (the deep human reason this happens), Observable (what it looks like in a normal week), Performance_Tax (the real weekly cost in time, energy, or team growth, written without the word "tax"), The_Win (what the reader gains by changing it).
- SEC_07_Dynamic_Calibration (The Trade-off): Abandon = 5 specific behaviours to let go of (one sentence each). Gain = 5 specific things the reader gets in return (one sentence each). Trade_Pairs = EXACTLY 5 paired narrative cards, each with: Let_Go_Of_Headline (a short habit name, 5 to 10 words), Let_Go_Of_Body (2 to 3 sentences explaining the human cost of this habit), You_Gain_Headline (a short outcome name, 2 to 5 words such as "Hours of strategic time back" or "Senior visibility"), You_Gain_Body (2 to 3 sentences explaining the professional benefit and how it positions the reader for the next level).
- SEC_08_Asset_Audit (The Power and The Tax): Intro = 2 to 3 sentences saying that each elite strength below is genuinely top-decile, that the point is not to dim them but to redirect them, and that used on design and prevention these same powers move the reader to the next level. Yield_Leak_Warnings = exactly 3 items pulled from the highest scoring traits. Each Warning is 3 to 4 full sentences: name the trait and score, praise it as a foundation of the reader's success, then explain kindly how spending that strength on small fires wastes their potential and what it teaches the team. Do not use the words "tax" or "leak" inside the prose.
- SEC_09_Behavioural_Audit.Forensic_Traits (The 9 Leadership Traits): EXACTLY 9 habits drawn from the lowest scoring traits. For each: Trait_Name, Score, Diagnosis (a simple reason this matters), Strategic_Yield (what changes when they shift it), Monday_Script (35 words or fewer, first person, the exact plain English sentence the reader can say to their team on Monday).
- SEC_10_90_Day_Pivot (The 90-Day Journey): three phases moving from a Fixer who does the work to a Leader who designs the team's way of working. Use Phase_1_Analyst, Phase_2_Designer, Phase_3_Architect, but write the content in plain English. Each phase: Focus, Human_Shift (the identity shift in plain words), AI_Lever (a concrete tool or technique the reader can use, named in everyday language).
- SEC_11_Investment_Thesis (The Professional Case): Status_of_Asset (a calm description of where the reader is now). Cost_of_Tactical_Fires (the real cost to the company of the reader spending time on small fires, in plain English). Redeployment_Recommendation (a respectful note their manager could read, asking for 8 hours a week of strategic design time and framing it as a benefit for the whole company's growth).
- SEC_12_90_Day_Command (The Weekly Command): Velocity_Metric (one clear, measurable target in plain English). Command (one small, clear action the reader can take immediately to start the change).
- SEC_13_The_Choice.The_Binary_Sting: write exactly this sentence, addressed to the reader: "Continue working harder every year, or start building a team that can eventually run without you."
- SEC_14_Notice_of_Plasticity (The Habit Warning): Provide all four fields. Why_Habits_Take_Time (3 to 4 sentences explaining that new leadership habits take about 90 days to feel natural, that this is how the brain physically rewires, and that new behaviour builds new neural pathways which only become the default once stronger than the old ones). What_Three_Months_Feel_Like (3 to 4 sentences walking through month 1 feeling awkward, month 2 feeling lighter as the team responds, and month 3 becoming the new default). The_Warning (2 to 3 sentences warning that abandoning the change inside the first thirty days lets the old pattern win and makes the next attempt harder, so the first month is the price of admission). Body = a 3 to 5 sentence summary combining the above (kept for backwards compatibility).
- SEC_15_Plasticity_Notice (final page, formal voice): Nature (2 to 3 sentences: this Pivot Report is a professional development diagnostic based on the TEMR Growth (Sweden) framework, using Industrial-Organisational psychology models to provide a snapshot of the reader's current performance architecture). Non_Clinical_Status (2 to 3 sentences: this report is for leadership development and personal growth, an evidence-based behavioural assessment, not a medical or clinical psychiatric diagnosis, and the findings should be used to inform career strategy and behavioural habits). Neuroplasticity_Principle (3 to 4 sentences: leadership behaviours are not static, the TEMR scores represent the reader's As-Is operating state, deliberate practice and the 90-day journey can rewire these neural and behavioural patterns, and the reader's delta is a measurable gap, not a permanent ceiling).
Return valid JSON only. No markdown. No symbols like — or / or &.`;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

async function verifyPaymentToken(token: string, expectedAssessmentId: string | null): Promise<boolean> {
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const firstDot = payload.indexOf('.');
  if (firstDot < 0) return false;
  const assessmentId = payload.slice(0, firstDot);
  const exp = Number(payload.slice(firstDot + 1));
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false;
  if (expectedAssessmentId && expectedAssessmentId !== assessmentId) return false;
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const expected = new TextDecoder().decode(encodeHex(new Uint8Array(signed)));
    return expected === sig;
  } catch {
    return false;
  }
}
