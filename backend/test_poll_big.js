const prompt = "You are an expert TCS exam coach. A student answered this question incorrectly. Provide a complete and detailed concept explanation in clear English.\nQuestion: What is 2+2?\nCorrect Answer: 4";
fetch('https://text.pollinations.ai/openai', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://pollinations.ai',
    'Referer': 'https://pollinations.ai/'
  },
  body: JSON.stringify({
    model: 'openai',
    messages: [{ role: 'user', content: prompt }],
    stream: false
  })
}).then(async r => {
  console.log("Status:", r.status);
  console.log(await r.text());
}).catch(console.error);
