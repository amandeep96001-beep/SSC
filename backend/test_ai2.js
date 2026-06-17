const prompt = `You are an expert SSC CGL/CHSL exam coach. A student got this question WRONG. Provide a crisp, highly structured explanation optimized for SSC aspirants in easy-to-understand English.

Question: The First Five Year Plan was released in the year _______.
Correct Answer: 1951

Use this EXACT structure with very short, punchy points:
**1. Core Concept:** (1 line naming the SSC topic & formula/rule)
**2. Step-by-Step Solution:** (2-3 very short bullet points showing the exact steps)
**3. Ninja Technique (Shortcut):** (How to solve this in 10 seconds without pen/paper, or using options elimination)
**4. Pro Tip:** (What silly mistake to avoid next time)
**5. Expected in SSC (Related Facts):** (Provide 3 highly related one-liner facts or variations from this exact topic that frequently appear in SSC. e.g., if the question is on Himachal folk dance, list 3 other famous states and their dances. If it's a math/vocab question, show 3 similar high-frequency concepts/words).

Do not use long paragraphs. Use bullet points and bold text for readability.`;

async function tryPollinations(prompt) {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  console.log('Pollinations status:', res.status, 'text length:', text.length);
  if (res.status !== 200) console.log(text);
}
tryPollinations(prompt).catch(console.error);
