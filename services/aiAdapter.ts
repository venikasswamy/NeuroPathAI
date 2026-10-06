// ============================================================================
// AI Adapter — Centralized intelligence layer
// Supports deterministic fallback when no LLM API key is configured
// Optional OpenAI-compatible integration via OPENAI_API_KEY env var
// ============================================================================

export interface AIResponse {
  content: string;
  source: 'llm' | 'deterministic';
  model?: string;
}

function hasLLMKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Query an optional LLM. Falls back to deterministic logic when no API key exists.
 * This function runs server-side only.
 */
export async function queryLLM(
  prompt: string,
  fallback: () => string,
  systemPrompt?: string
): Promise<AIResponse> {
  if (!hasLLMKey()) {
    return { content: fallback(), source: 'deterministic' };
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return { content: fallback(), source: 'deterministic' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { content: fallback(), source: 'deterministic' };
    }

    return { content, source: 'llm', model };
  } catch {
    return { content: fallback(), source: 'deterministic' };
  }
}

export function isLLMConfigured(): boolean {
  return hasLLMKey();
}
