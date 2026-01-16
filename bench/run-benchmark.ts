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

const API = process.env.BENCH_API ?? "http://localhost:5000/api/mcp/benchmark";
const MODE = process.env.BENCH_MODE ?? "neo"; // "neo" | "legacy"
const DATASET = process.env.BENCH_DATASET ?? path.join(process.cwd(), "bench/dataset.jsonl");

// No CSRF needed for benchmark endpoint

function now() { return Date.now(); }

async function post(caseItem: Case): Promise<Result> {
  const t0 = now();
  const res = await fetch(API + `?mode=${MODE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseItem),
  });

  const latencyMs = now() - t0;
  const json: any = await res.json().catch(() => ({}));

  // Debug: log response for first request
  if (!globalThis.debugLogged) {
    console.error('DEBUG Response:', JSON.stringify(json, null, 2));
    globalThis.debugLogged = true;
  }

  // Parse response based on actual API structure
  let intent = "unknown";
  let mode = "unknown";
  let model = "unknown";
  let requiresHumanReview = false;

  if (json?.success && json?.data) {
    // Neo mode response structure
    intent = json.data.intent || "unknown";
    mode = json.data.processing?.processingMode || "legacy";
    model = json.data.model || json.data.processing?.actualModel || "unknown";
    requiresHumanReview = json.data.processing?.requiresHumanReview || false;
  } else if (json?.intent) {
    // Legacy mode response structure
    intent = json.intent;
    mode = json.processing?.processingMode || "legacy";
    model = json.model || json.processing?.actualModel || "unknown";
    requiresHumanReview = json.processing?.requiresHumanReview || false;
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