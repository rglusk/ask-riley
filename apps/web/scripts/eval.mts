/**
 * Eval harness for ask-riley.
 *
 * Runs each case's question through the real agent loop — real model, real MCP
 * tools — with a recording `send` instead of an SSE stream, then asserts on the
 * SHAPE of what came back (tools called, trust state, block types). Content is
 * non-deterministic; structure is what the prompt controls, so structure is
 * what we measure.
 *
 *   pnpm --filter web eval
 *   pnpm --filter web eval -- --runs=3            # repeat each case, report a rate
 *   pnpm --filter web eval -- --only=tonight      # substring filter on case name
 *   pnpm --filter web eval -- --verbose           # dump envelopes for failures
 *
 * NOTE: every run costs real tokens. Twelve cases ≈ pennies, but this is a
 * deliberate command, not a watch task.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { Block, ChatResponse } from "@ask-riley/schema";
import { runAgentLoop, type ChatEvent } from "../lib/agent.js";
import { cases, type EvalCase } from "./eval-cases.js";

const args = process.argv.slice(2);
const runs = Number(args.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 1);
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1];
const verbose = args.includes("--verbose");

type RunResult = {
    toolCalls: string[];
    response: ChatResponse | null;
    failures: string[];
};

async function runOnce(testCase: EvalCase): Promise<RunResult> {
    const events: ChatEvent[] = [];
    const messages: Anthropic.MessageParam[] = [
        { role: "user", content: testCase.question },
    ];

    // the seam: the loop writes to SSE in production and to an array here
    await runAgentLoop(messages, (event) => events.push(event));

    const toolCalls = events
        .filter((e): e is Extract<ChatEvent, { type: "status" }> => e.type === "status")
        .map((e) => e.tool);

    const done = events.find(
        (e): e is Extract<ChatEvent, { type: "done" }> => e.type === "done",
    );
    const response = done?.response ?? null;

    return { toolCalls, response, failures: check(testCase, toolCalls, response) };
}

function check(
    testCase: EvalCase,
    toolCalls: string[],
    response: ChatResponse | null,
): string[] {
    const failures: string[] = [];
    const { expect } = testCase;

    if (!response) return ["no done event / no envelope"];

    for (const tool of expect.tools ?? []) {
        if (!toolCalls.includes(tool)) {
            failures.push(`missing tool call: ${tool} (called: ${toolCalls.join(", ") || "none"})`);
        }
    }

    if (expect.maxToolCalls !== undefined && toolCalls.length > expect.maxToolCalls) {
        failures.push(`${toolCalls.length} tool calls > max ${expect.maxToolCalls} (${toolCalls.join(", ")})`);
    }

    if (expect.state && response.state !== expect.state) {
        failures.push(`state: expected ${expect.state}, got ${response.state}`);
    }

    const counts = countBlockTypes(response.blocks);

    for (const [type, expected] of Object.entries(expect.blockTypes ?? {})) {
        const actual = counts[type as Block["type"]] ?? 0;
        if (actual !== expected) {
            failures.push(`${type}: expected ${expected}, got ${actual}`);
        }
    }

    for (const type of expect.hasBlocks ?? []) {
        if (!counts[type]) failures.push(`missing block type: ${type}`);
    }

    for (const type of expect.noBlocks ?? []) {
        if (counts[type]) failures.push(`unexpected block type: ${type} (×${counts[type]})`);
    }

    const custom = expect.custom?.(response);
    if (custom) failures.push(custom);

    return failures;
}

function countBlockTypes(blocks: Block[]): Partial<Record<Block["type"], number>> {
    const counts: Partial<Record<Block["type"], number>> = {};
    for (const block of blocks) {
        counts[block.type] = (counts[block.type] ?? 0) + 1;
    }
    return counts;
}

function summarize(response: ChatResponse | null): string {
    if (!response) return "—";
    const blocks = Object.entries(countBlockTypes(response.blocks))
        .map(([type, n]) => (n > 1 ? `${type}×${n}` : type))
        .join(" + ");
    return `${response.state} | ${blocks}`;
}

async function main() {
    const selected = only
        ? cases.filter((c) => c.name.toLowerCase().includes(only.toLowerCase()))
        : cases;

    if (selected.length === 0) {
        console.error(`no cases match --only=${only}`);
        process.exit(1);
    }

    console.log(`\nask-riley evals — ${selected.length} case(s) × ${runs} run(s)\n`);

    let totalPassed = 0;
    let totalRuns = 0;

    for (const testCase of selected) {
        const results: RunResult[] = [];
        for (let i = 0; i < runs; i++) {
            try {
                results.push(await runOnce(testCase));
            } catch (err) {
                results.push({
                    toolCalls: [],
                    response: null,
                    failures: [`threw: ${err instanceof Error ? err.message : String(err)}`],
                });
            }
        }

        const passed = results.filter((r) => r.failures.length === 0).length;
        totalPassed += passed;
        totalRuns += results.length;

        const mark = passed === results.length ? "PASS" : passed === 0 ? "FAIL" : "FLAKY";
        const rate = runs > 1 ? ` ${passed}/${runs}` : "";
        console.log(`[${mark}]${rate} ${testCase.name}`);
        console.log(`       tools: ${results[0].toolCalls.join(", ") || "none"}`);
        console.log(`       got:   ${summarize(results[0].response)}`);

        const seen = new Set<string>();
        for (const result of results) {
            for (const failure of result.failures) {
                if (seen.has(failure)) continue;
                seen.add(failure);
                console.log(`       ✗ ${failure}`);
            }
        }

        if (verbose && passed < results.length) {
            console.log(`       envelope: ${JSON.stringify(results[0].response, null, 2).replace(/\n/g, "\n       ")}`);
        }

        console.log();
    }

    console.log(`total: ${totalPassed}/${totalRuns} runs passed\n`);
    process.exit(totalPassed === totalRuns ? 0 : 1);
}

main();
