/**
 * LLM client — multi-provider, bring your own key.
 * Supports: Kimi K3 (Moonshot), Claude (Anthropic), OpenAI-compatible.
 */

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface LLMResponse {
  text: string;
  toolCalls: ToolCall[];
  usage: { input: number; output: number };
}

type Provider = "kimi" | "anthropic" | "openai";

function detectProvider(model: string): Provider {
  if (model.startsWith("kimi")) return "kimi";
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
}

export async function llm(
  messages: Message[],
  opts: { model?: string; tools?: ToolDef[]; system?: string } = {},
): Promise<LLMResponse> {
  const model = opts.model || process.env.POKIO_MODEL || "kimi-k3";
  const provider = detectProvider(model);

  if (provider === "anthropic") return callAnthropic(messages, model, opts);
  return callOpenAICompat(messages, model, opts, provider);
}

// ─── Anthropic ─────────────────────────────────────────────────────────────

async function callAnthropic(
  messages: Message[], model: string,
  opts: { tools?: ToolDef[]; system?: string },
): Promise<LLMResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Set ANTHROPIC_API_KEY");

  const aliases: Record<string, string> = {
    "claude-sonnet": "claude-sonnet-4-6",
    "claude-opus": "claude-opus-4-6",
    "claude-haiku": "claude-haiku-4-5-20251001",
  };

  const body: Record<string, unknown> = {
    model: aliases[model] || model,
    max_tokens: 4096,
    messages: messages.filter(m => m.role !== "system"),
  };
  if (opts.system) body.system = opts.system;
  if (opts.tools?.length) {
    body.tools = opts.tools.map(t => ({
      name: t.name, description: t.description, input_schema: t.parameters,
    }));
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;

  let text = "";
  const toolCalls: ToolCall[] = [];
  for (const block of data.content || []) {
    if (block.type === "text") text += block.text;
    if (block.type === "tool_use") {
      toolCalls.push({ id: block.id, name: block.name, args: block.input });
    }
  }

  return {
    text, toolCalls,
    usage: { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 },
  };
}

// ─── OpenAI-compatible (Kimi, OpenAI, etc.) ────────────────────────────────

async function callOpenAICompat(
  messages: Message[], model: string,
  opts: { tools?: ToolDef[]; system?: string },
  provider: Provider,
): Promise<LLMResponse> {
  const endpoints: Record<string, { url: string; keyEnv: string }> = {
    kimi: { url: "https://api.moonshot.ai/v1/chat/completions", keyEnv: "MOONSHOT_API_KEY" },
    openai: { url: "https://api.openai.com/v1/chat/completions", keyEnv: "OPENAI_API_KEY" },
  };

  const { url, keyEnv } = endpoints[provider] || endpoints.openai;
  const key = process.env[keyEnv];
  if (!key) throw new Error(`Set ${keyEnv}`);

  const msgs = [...messages];
  if (opts.system) msgs.unshift({ role: "system", content: opts.system });

  const body: Record<string, unknown> = { model, messages: msgs };
  if (opts.tools?.length) {
    body.tools = opts.tools.map(t => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  const choice = data.choices?.[0]?.message || {};

  const toolCalls: ToolCall[] = [];
  if (choice.tool_calls) {
    for (const tc of choice.tool_calls) {
      let args = {};
      try { args = JSON.parse(tc.function?.arguments || "{}"); } catch {}
      toolCalls.push({ id: tc.id, name: tc.function?.name || "", args });
    }
  }

  return {
    text: choice.content || "",
    toolCalls,
    usage: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 },
  };
}
