/**
 * Built-in tools — shell, GitHub, Slack, files.
 * Each tool is a function the LLM can call.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { ToolDef } from "./llm.js";

export interface ToolResult {
  output: string;
  error?: string;
}

// ─── Tool definitions (sent to LLM) ─────────────────────────────────────

export const TOOL_DEFS: ToolDef[] = [
  {
    name: "shell",
    description: "Run a shell command. Use for git, npm, gh CLI, curl, etc. Returns stdout and stderr.",
    parameters: {
      type: "object",
      properties: {
        cmd: { type: "string", description: "Shell command to execute" },
      },
      required: ["cmd"],
    },
  },
  {
    name: "read_file",
    description: "Read a file's contents.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file. Creates directories as needed.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to write" },
        content: { type: "string", description: "File content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "List files in a directory.",
    parameters: {
      type: "object",
      properties: {
        dir: { type: "string", description: "Directory path (default: current)" },
      },
    },
  },
  {
    name: "ask_human",
    description: "Ask the human operator a question and wait for their response. Use before any consequential action (sending emails, posting to Slack, merging PRs).",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Question to ask the human" },
      },
      required: ["question"],
    },
  },
];

// ─── Tool execution ──────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  opts: { cwd?: string; onAskHuman?: (q: string) => Promise<string> },
): Promise<ToolResult> {
  const cwd = opts.cwd || process.cwd();

  switch (name) {
    case "shell": {
      const cmd = args.cmd as string;
      try {
        const stdout = execSync(cmd, {
          cwd, encoding: "utf-8", timeout: 60000,
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        });
        return { output: stdout.slice(0, 50000) };
      } catch (e: any) {
        return { output: e.stdout?.slice(0, 30000) || "", error: e.stderr?.slice(0, 10000) || e.message };
      }
    }

    case "read_file": {
      const path = join(cwd, args.path as string);
      if (!existsSync(path)) return { output: "", error: "File not found" };
      return { output: readFileSync(path, "utf-8").slice(0, 100000) };
    }

    case "write_file": {
      const path = join(cwd, args.path as string);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, args.content as string);
      return { output: `Written: ${args.path}` };
    }

    case "list_files": {
      const dir = join(cwd, (args.dir as string) || ".");
      if (!existsSync(dir)) return { output: "", error: "Directory not found" };
      const files = walk(dir, cwd).slice(0, 200);
      return { output: files.join("\n") };
    }

    case "ask_human": {
      const question = args.question as string;
      if (opts.onAskHuman) {
        const answer = await opts.onAskHuman(question);
        return { output: answer };
      }
      return { output: "approved" };
    }

    default:
      return { output: "", error: `Unknown tool: ${name}` };
  }
}

function walk(dir: string, base: string, depth = 0): string[] {
  if (depth > 4) return [];
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = join(dir, entry.name);
      const rel = full.replace(base + "/", "");
      if (entry.isDirectory()) {
        results.push(rel + "/");
        results.push(...walk(full, base, depth + 1));
      } else {
        results.push(rel);
      }
    }
  } catch {}
  return results;
}
