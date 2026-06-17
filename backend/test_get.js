fetch('https://text.pollinations.ai/hello', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/plain'
  }
}).then(r => r.text()).then(console.log).catch(console.error);
