#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

type Case = {
  email: string;
  message?: string;
  source: string;
  expected_intent: "high" | "medium" | "low" | "spam";
};

type Result = {
  expected: Case["expected_intent"];
  got: string;
  mode?: string;
  model?: string;
  requiresHumanReview?: boolean;
  latencyMs: number;
};

const API = process.env.BENCH_API ?? "http://127.0.0.1:5001/api/mcp/benchmark";
const MODE = process.env.BENCH_MODE ?? "neo"; // "neo" | "legacy"
const DATASET = process.env.BENCH_DATASET ?? path.join(process.cwd(), "bench", "datasets", "dataset.jsonl");

// No CSRF needed for benchmark endpoint

function now() { return Date.now(); }

async function post(caseItem: Case): Promise<Result> {
  const t0 = now();
  const res = await fetch(API + `?mode=${MODE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: JSON.stringify(caseItem),
  });

  const latencyMs = now() - t0;

  let json: any = {};
  try {
    json = await res.json();
  } catch (e) {
    console.error('JSON Parse Error:', e);
    // Try to get text response instead
    try {
      const text = await res.text();
      console.error('Raw Response Text:', text);
    } catch (e2) {
      console.error('Could not get response text either');
    }
    json = { error: 'json_parse_failed' };
  }

  // Debug: log response for first request
  if (!globalThis.debugLogged) {
    console.error('DEBUG Response:', JSON.stringify(json, null, 2));
    console.error('DEBUG Status:', res.status);
    console.error('DEBUG Headers:', Object.fromEntries(res.headers.entries()));
    globalThis.debugLogged = true;
  }

  // Parse response based on actual API structure
  let intent = "unknown";
  let mode = "unknown";
  let model = "unknown";
  let requiresHumanReview = false;

  if (json?.intent?.intent) {
    // Neo mode response structure (direct response)
    intent = json.intent.intent;
    mode = json.processing?.processingMode || "llm";
    model = json.processing?.actualModel || json.intent?.model || "unknown";
    requiresHumanReview = json.processing?.requiresHumanReview || false;
  } else if (json?.success && json?.data) {
    // Legacy mode response structure (wrapped)
    intent = json.data.intent || "unknown";
    mode = json.data.processing?.processingMode || "legacy";
    model = json.data.model || json.data.processing?.actualModel || "unknown";
    requiresHumanReview = json.data.processing?.requiresHumanReview || false;
  }

  return { expected: caseItem.expected_intent, got: String(intent), mode, model, requiresHumanReview, latencyMs };
}

function macroF1(results: Result[]) {
  const labels = ["high","medium","low","spam"] as const;
  const perLabel = labels.map(l => {
    let tp=0, fp=0, fn=0;
    for (const r of results) {
      const pred = r.got as any;
      if (pred === l && r.expected === l) tp++;
      if (pred === l && r.expected !== l) fp++;
      if (pred !== l && r.expected === l) fn++;
    }
    const prec = tp + fp === 0 ? 0 : tp/(tp+fp);
    const rec  = tp + fn === 0 ? 0 : tp/(tp+fn);
    const f1   = (prec+rec) === 0 ? 0 : (2*prec*rec)/(prec+rec);
    return f1;
  });
  return perLabel.reduce((a,b)=>a+b,0)/perLabel.length;
}

async function main() {
  const lines = fs.readFileSync(DATASET, "utf8").split("\n").filter(Boolean);
  const cases: Case[] = lines.map(l => JSON.parse(l));

  const results: Result[] = [];
  for (const c of cases) results.push(await post(c));

  const acc = results.filter(r => r.got === r.expected).length / results.length;
  const f1 = macroF1(results);

  const lat = results.map(r => r.latencyMs).sort((a,b)=>a-b);
  const p = (q:number) => lat[Math.floor((lat.length-1)*q)];

  const modeCounts: Record<string, number> = {};
  for (const r of results) modeCounts[r.mode ?? "unknown"] = (modeCounts[r.mode ?? "unknown"] ?? 0) + 1;

  console.log(JSON.stringify({
    mode: MODE,
    n: results.length,
    accuracy: acc,
    macroF1: f1,
    latencyMs: { p50: p(0.50), p95: p(0.95), p99: p(0.99) },
    processingModeDist: modeCounts,
    samples: results.slice(0, 8),
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });