const prompt = `You are an expert SSC CGL/CHSL exam coach. A student got this question WRONG. Provide a crisp, highly structured explanation optimized for SSC aspirants in easy-to-understand English.

Question: The First Five Year Plan was released in the year _______.
Correct Answer: 1951`;

async function tryPollinationsPost(prompt) {
  const url = `https://text.pollinations.ai/openai`;
  const res = await fetch(url, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  const text = await res.text();
  console.log('Pollinations POST status:', res.status, 'text length:', text.length);
  if (res.status !== 200) console.log(text);
}
tryPollinationsPost(prompt).catch(console.error);
