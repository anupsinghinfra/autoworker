/**
 * Worker — the agentic loop.
 * Takes a task, calls LLM with tools, executes tool calls, repeats until done.
 */

import { llm, type Message, type ToolCall } from "./llm.js";
import { TOOL_DEFS, executeTool } from "./tools.js";
import { db } from "./store.js";

const SYSTEM = `You are AutoWorker — an AI employee that delivers finished work.

You have tools: shell (for git, gh, curl, npm), read_file, write_file, list_files, ask_human.

Rules:
- Use ask_human before anything consequential (sending messages, merging PRs, deploying)
- Use shell with gh CLI for GitHub operations
- Use shell with curl for Slack/API calls
- Be efficient. Don't read files you don't need.
- When done, respond with a clear summary of what you did.`;

export interface WorkResult {
  text: string;
  steps: number;
  error?: string;
}

export async function runWorker(
  task: string,
  opts: {
    model?: string;
    maxSteps?: number;
    cwd?: string;
    onStep?: (step: number, action: string) => void;
    onAskHuman?: (question: string) => Promise<string>;
  } = {},
): Promise<WorkResult> {
  const maxSteps = opts.maxSteps || 50;
  const model = opts.model || process.env.AUTOWORKER_MODEL || "kimi-k3";
  const messages: Message[] = [{ role: "user", content: task }];
  let steps = 0;

  // Log task
  db().prepare(
    "INSERT INTO tasks (id, task, status, started_at) VALUES (?, ?, 'running', ?)"
  ).run(Date.now().toString(), task, new Date().toISOString());

  while (steps < maxSteps) {
    const response = await llm(messages, { model, tools: TOOL_DEFS, system: SYSTEM });

    // No tool calls — done
    if (response.toolCalls.length === 0) {
      db().prepare("UPDATE tasks SET status = 'completed', result = ? WHERE status = 'running'")
        .run(response.text.slice(0, 5000));
      return { text: response.text, steps };
    }

    // Add assistant message with tool calls
    messages.push({ role: "assistant", content: response.text || "" });

    // Execute each tool call
    for (const tc of response.toolCalls) {
      steps++;
      opts.onStep?.(steps, `${tc.name}(${JSON.stringify(tc.args).slice(0, 80)})`);

      const result = await executeTool(tc.name, tc.args, {
        cwd: opts.cwd,
        onAskHuman: opts.onAskHuman,
      });

      // Log step
      db().prepare(
        "INSERT INTO steps (task_id, step, tool, args, output, error, ts) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        "", steps, tc.name,
        JSON.stringify(tc.args).slice(0, 2000),
        result.output.slice(0, 5000),
        result.error || null,
        new Date().toISOString(),
      );

      messages.push({
        role: "tool",
        content: result.error ? `ERROR: ${result.error}\n${result.output}` : result.output,
        tool_call_id: tc.id,
      });
    }
  }

  return { text: "Reached max steps", steps, error: "max_steps" };
}
