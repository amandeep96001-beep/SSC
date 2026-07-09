/**
 * aiController.js
 * Server-side AI explanation proxy — avoids browser Turnstile bot checks.
 * Primary: Pollinations.ai OpenAI-compatible POST endpoint (free, no key)
 * Fallback: HuggingFace Inference API (free, no key, rate-limited)
 */

const POLLINATIONS_URL = 'https://text.pollinations.ai/openai';
const HF_URL = 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta';

function buildPrompt(question, correctAnswer, explanation) {
  return `You are an expert SSC CGL/CHSL exam coach. A student got this question WRONG. Provide a crisp, highly structured explanation optimized for SSC aspirants in easy-to-understand English.

Question: ${question}
Correct Answer: ${correctAnswer}
${explanation ? `Official Explanation: ${explanation}` : ''}

Use this EXACT structure with very short, punchy points:
**1. Core Concept:** (1 line naming the SSC topic & formula/rule. For Maths — write the exact formula with variables. For GK — name the exact sub-topic and category.)
**2. Why This Answer:** (In 1-2 bullet points, explain WHY the correct answer is correct. For Maths, show the formula applied with numbers. For GK/English, give the factual reasoning.)
**3. Pro Tip:** (What silly mistake to avoid next time, or a memory trick/mnemonic to remember this forever.)
**4. Expected in SSC — 10 Related Facts/Questions:** (This is the MOST IMPORTANT section. Provide EXACTLY 10 highly relevant one-liner facts, formulas, or mini-questions from this EXACT sub-topic that frequently appear in SSC exams. Make each one independently useful so the student can learn the full topic just from this list.)
  - For GK: If the question is about Himachal folk dance, list 10 other states and their famous folk dances. If it's about a river, list 10 rivers with origin and endpoint.
  - For Maths: If it's about Profit & Loss, list 10 key formulas/shortcuts with examples. If it's about Trigonometry, list 10 important identities/values.
  - For English: If it's about synonyms, list 10 high-frequency SSC vocabulary words with meanings. If it's an idiom, list 10 most repeated SSC idioms with meanings.
  - For Reasoning: If it's about coding-decoding, list 10 common patterns. If it's about series, list 10 frequently tested number/letter series patterns.
  Format each as: **1.** fact — detail

Do not use long paragraphs. Use bullet points and bold text for readability. The "Expected in SSC" section should be detailed enough that a student can revise the entire sub-topic from it alone.`;
}

async function tryPollinations(prompt, retries = 3) {
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
      console.warn(`[AI] Pollinations 429 (Queue full), retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s before retry
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pollinations error: ${body}`);
    }

    const text = await res.text();
    if (!text) throw new Error('Empty response from Pollinations');
    return text.trim();
  }
  
  throw new Error('Pollinations rate limit (429) exceeded after retries.');
}

async function tryHuggingFace(prompt) {
  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({
      inputs: `<|system|>You are an expert TCS exam coach.</s><|user|>${prompt}</s><|assistant|>`,
      parameters: { max_new_tokens: 600, temperature: 0.7, return_full_text: false }
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!res.ok) throw new Error(`HuggingFace error: ${res.status}`);

  const json = await res.json();
  // HF returns an array
  const text = Array.isArray(json) ? json[0]?.generated_text : json?.generated_text;
  if (!text) throw new Error('Empty response from HuggingFace');
  return text.trim();
}

export const explainConcept = async (req, res, next) => {
  try {
    const { question, correctAnswer, explanation } = req.body;
    if (!question || !correctAnswer) {
      return res.status(400).json({ status: 'error', message: 'question and correctAnswer are required.' });
    }

    const prompt = buildPrompt(question, correctAnswer, explanation);

    let aiText = null;

    // Try Pollinations first (server-side, no Turnstile needed)
    try {
      aiText = await tryPollinations(prompt);
    } catch (err) {
      console.warn('[AI] Pollinations failed, trying HuggingFace:', err.message);
    }

    // Fallback to HuggingFace
    if (!aiText) {
      try {
        aiText = await tryHuggingFace(prompt);
      } catch (err) {
        console.error('[AI] HuggingFace also failed:', err.message);
      }
    }

    if (!aiText) {
      console.warn('[AI] All AI services failed. Using local static fallback.');
      aiText = `**1. Core Concept:**
SSC high-frequency topic.

**2. Why This Answer:**
- The correct answer is **${correctAnswer}**.
${explanation ? `- ${explanation}` : '- Refer to your notes or standard SSC textbooks for the detailed reasoning.'}

**3. Pro Tip:**
Add this to your revision notes and practice 10+ similar questions. Many students skip revision of wrong answers and lose easy marks.

**4. Expected in SSC — 10 Related Facts/Questions:**
⚠️ AI services are temporarily unavailable, so we can't generate topic-specific facts right now. In the meantime:
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

    res.json({ status: 'success', data: { explanation: aiText } });
  } catch (error) {
    next(error);
  }
};
