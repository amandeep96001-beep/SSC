import type { RequestHandler } from 'express';
import { errorMessage, isRecord } from '../../types/domain.js';

/**
 * ai.controller.js
 *
 * explainConcept — wrong-answer drill explainer (DrillWorkspace)
 *   Primary:  Gemini REST API when GEMINI_API_KEY is set
 *   Fallback: Pollinations (free, no key)
 *   Last:     static local template
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash';

function buildPrompt(question: unknown, correctAnswer: unknown, explanation: unknown): string {
  return `You are an expert competitive-exam coach (SSC, Banking, Railways, UPSC Prelims, CAT, State PSC). A student got this question WRONG. Provide a crisp, highly structured explanation optimized for aspirants in easy-to-understand English.

Question: ${question}
Correct Answer: ${correctAnswer}
${explanation ? `Official Explanation: ${explanation}` : ''}

Use this EXACT structure. Finish ALL four sections completely — never stop mid-heading:
**1. Core Concept:** (1 line naming the topic & formula/rule. For Maths — write the exact formula with variables. For GK — name the exact sub-topic and category.)
**2. Why This Answer:** (In 1-2 bullet points, explain WHY the correct answer is correct. For Maths, show the formula applied with numbers. For GK/English, give the factual reasoning.)
**3. Pro Tip:** (What silly mistake to avoid next time, or a memory trick/mnemonic to remember this forever.)
**4. Expected in Exams — 10 Related Facts/Questions:** (MOST IMPORTANT. Provide EXACTLY 10 highly relevant one-liner facts, formulas, or mini-questions from this EXACT sub-topic that frequently appear in Indian competitive exams.)
  Format each as: **1.** fact — detail

Do not use long paragraphs. Use bullet points and bold text. Close every **bold** marker. Complete every section.`;
}

function extractGeminiText(json: unknown): string {
  if (!isRecord(json)) return '';
  const candidates = json.candidates;
  if (!Array.isArray(candidates) || !isRecord(candidates[0])) return '';
  const content = candidates[0].content;
  if (!isRecord(content)) return '';
  const parts = content.parts;
  if (!Array.isArray(parts) || parts.length === 0) return '';
  // Prefer non-thought parts; fall back to any text
  const visible = parts.filter((p) => isRecord(p) && p.text && !p.thought).map((p) => String(isRecord(p) ? p.text : '')).join('');
  if (visible.trim()) return visible.trim();
  return parts
    .map((p) => (isRecord(p) && p.text != null ? String(p.text) : ''))
    .filter(Boolean)
    .join('')
    .trim();
}

function isUsableExplanation(text: unknown): text is string {
  if (typeof text !== 'string' || text.length < 80) return false;
  // Reject truncated stubs that stop mid-heading (common Pollinations failure)
  const openBold = (text.match(/\*\*/g) || []).length;
  if (openBold % 2 === 1 && text.length < 400) return false;
  if (/\*\*\s*2\.\s*Why\s*$/i.test(text.trim())) return false;
  return true;
}

async function tryPollinations(prompt: string, retries = 2): Promise<string> {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;

  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain, */*'
      },
      signal: AbortSignal.timeout(30000)
    });

    if (res.status === 429) {
      console.warn(`[AI] Pollinations 429, retrying... (${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pollinations error: ${res.status} ${body.slice(0, 120)}`);
    }

    const text = (await res.text()).trim();
    if (!isUsableExplanation(text)) {
      throw new Error('Pollinations returned empty/truncated explanation');
    }
    return text;
  }

  throw new Error('Pollinations rate limit (429) exceeded after retries.');
}

async function tryGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        // Thinking models count thoughts against this budget — keep headroom + disable thinking
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = isRecord(json) && isRecord(json.error) && typeof json.error.message === 'string'
      ? json.error.message
      : `HTTP ${res.status}`;
    throw new Error(`Gemini error: ${msg}`);
  }

  const text = extractGeminiText(json);
  const finish = isRecord(json) && Array.isArray(json.candidates) && isRecord(json.candidates[0])
    ? json.candidates[0].finishReason
    : undefined;
  if (!text) {
    throw new Error(`Empty response from Gemini (finishReason=${finish || 'unknown'})`);
  }
  if (!isUsableExplanation(text)) {
    throw new Error(`Gemini returned truncated explanation (finishReason=${finish || 'unknown'})`);
  }
  return text;
}

function staticFallback(correctAnswer: unknown, explanation: unknown): string {
  return `**1. Core Concept:**
SSC high-frequency topic.

**2. Why This Answer:**
- The correct answer is **${correctAnswer}**.
${explanation ? `- ${explanation}` : '- Refer to your notes or standard SSC textbooks for the detailed reasoning.'}

**3. Pro Tip:**
Add this to your revision notes and practice 10+ similar questions. Many students skip revision of wrong answers and lose easy marks.

**4. Expected in SSC — 10 Related Facts/Questions:**
AI services are temporarily unavailable, so we can't generate topic-specific facts right now. In the meantime:
- **1.** Revise the complete sub-topic around this question from your notes.
- **2.** Search this topic in your TCS PYQ bank — at least 5-8 similar questions will be there.
- **3.** Note down the correct answer and any formula/fact associated with it.
- **4.** Practice 10 related questions from the same chapter/category.
- **5.** Make a quick one-page cheat sheet of this sub-topic.
- **6.** Test yourself on this topic again tomorrow (spaced repetition).
- **7.** Check previous year papers (2019-2024) for this exact sub-topic.
- **8.** Cross-reference with Lucent's/Arihant for additional facts.
- **9.** Create mnemonics or memory tricks for tricky facts.
- **10.** Discuss this topic with fellow aspirants for better retention.`;
}

export const explainConcept: RequestHandler = async (req, res, next) => {
  try {
    const { question, correctAnswer, explanation } = req.body;
    if (!question || !correctAnswer) {
      return res.status(400).json({ status: 'error', message: 'question and correctAnswer are required.' });
    }
    if (String(question).length > 4000 || String(correctAnswer).length > 500) {
      return res.status(400).json({ status: 'error', message: 'Question payload is too large.' });
    }

    const prompt = buildPrompt(question, correctAnswer, explanation);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
    let aiText: string | null = null;
    let provider: string | null = null;

    // Prefer Gemini when configured — Pollinations often truncates mid-section
    const chain: [string, (p: string) => Promise<string>][] = hasGemini
      ? [
          ['Gemini', tryGemini],
          ['Pollinations', tryPollinations],
        ]
      : [['Pollinations', tryPollinations]];

    for (const [name, fn] of chain) {
      try {
        aiText = await fn(prompt);
        provider = name;
        break;
      } catch (err) {
        console.warn(`[AI] ${name} failed:`, errorMessage(err));
      }
    }

    if (!aiText) {
      console.warn('[AI] All AI services failed. Using local static fallback.');
      aiText = staticFallback(correctAnswer, explanation);
      provider = 'static';
    }

    res.json({ status: 'success', data: { explanation: aiText, provider } });
  } catch (error) {
    next(error);
  }
};

