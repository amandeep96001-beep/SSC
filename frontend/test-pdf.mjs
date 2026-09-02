import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

const pdfPath = '/home/aman/Documents/SSC/frontend/src/shared/utils/1b995cfd-d8f1-41fd-bab1-1246b115c8ab.pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));

pdfjsLib.getDocument({ data }).promise.then(async (doc) => {
  const textParts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => (item.str ? (item.hasEOL ? `${item.str}\n` : `${item.str} `) : ''))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    textParts.push(text);
  }
  const fullText = textParts.join('\n\n');
  fs.writeFileSync('/home/aman/.gemini/antigravity/brain/4091b8ea-832f-4fba-ae62-718383657411/scratch/pdf-text.txt', fullText);
  console.log('Done, length:', fullText.length);
}).catch(console.error);
