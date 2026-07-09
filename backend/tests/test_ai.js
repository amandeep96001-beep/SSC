const prompt = "What is the capital of France?";
async function tryPollinations(prompt) {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  console.log('Pollinations status:', res.status, 'text:', text);
}
async function tryHuggingFace(prompt) {
  const res = await fetch('https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt })
  });
  const text = await res.text();
  console.log('HuggingFace status:', res.status, 'text:', text);
}
tryPollinations(prompt).catch(console.error);
tryHuggingFace(prompt).catch(console.error);
