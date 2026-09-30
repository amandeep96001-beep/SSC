# 🚀 CrackuEx Standalone Landing Page (High-Converting & SEO-Dominated)

यह Landing Page पूरी तरह से **Independently Deployable** (अलग से डिप्लॉय करने योग्य) बनाया गया है। आप इसे Vercel, Netlify, Cloudflare Pages, GitHub Pages, Render या किसी भी Static Hosting पर सिर्फ 1-क्लिक में अलग से डिप्लॉय कर सकते हैं।

---

## ⚡ मुख्य फीचर्स (Why SSC Aspirants Can't Resist)

1. **Interactive Speed Calculation Mini-Drill (10-Second Test)**:
   - 1-50 Tables, Fraction-to-Percentage (1/7, 1/13, 3/8), और Squares/Cubes का लाइव इंटरएक्टिव टेस्ट।
   - Topper percentile comparison और instant speed score।
2. **TCS Normalization & Cut-off Simulator**:
   - SSC CGL, CHSL, CPO, और GD के लिए Category-wise (UR, OBC, EWS, SC, ST) और Shift Difficulty के आधार पर रीयलिस्टिक कट-ऑफ प्रेडिक्टर।
3. **Live Exam Countdown Radar**:
   - Upcoming SSC CGL 2026 Tier 1, CHSL, CPO, MTS, GD का लाइव काउंटडाउन क्लॉक।
4. **TCS Subject-Wise Weightage & PYQ Hotspot Matrix**:
   - Quant, Reasoning, English, और GA के सबसे ज्यादा रिपीट होने वाले चैप्टर्स और मार्क्स वेटेज।
5. **Aspirant Success Stories & 4.9/5 Rating Social Proof**:
   - Mukherjee Nagar, Prayagraj, Jaipur, और Patna के सीरियस एस्पिरेंट्स के रिव्यूज।
6. **Ultra-Dominant SEO & Google Rich Snippets**:
   - Pre-rendered crawler-friendly Semantic HTML.
   - Comprehensive `Schema.org` JSON-LD (`WebSite`, `SoftwareApplication` with 4.9/5 stars, `FAQPage` with expandable Google SERP accordions, `Course`).
   - High-CTR Meta Tags, OpenGraph (WhatsApp, Telegram preview), Twitter Cards, Sitemap, और Robots.txt.

---

## 🛠️ Local Development (लोकल में कैसे चलाएं)

Root डायरेक्टरी से:
```bash
npm run dev:landing
```
या `landing` डायरेक्टरी के अंदर से:
```bash
cd landing
npm install
npm run dev
```
लोकल सर्वर `http://localhost:5174` पर चालू हो जाएगा।

---

## 📦 Production Build (बिल्ड कैसे बनाएं)

Root डायरेक्टरी से:
```bash
npm run build:landing
```
या `landing` डायरेक्टरी के अंदर से:
```bash
cd landing
npm run build
```
बिल्ड आउटपुट `landing/dist` फोल्डर में आ जाएगा (मात्र ~99KB gzip, ultra-fast sub-500ms load time).

---

## 🌐 Separate Deployment Guide (अलग से कैसे Deploy करें)

### विकल्प 1: Vercel पर 1-क्लिक डिप्लॉय (Recommended)
1. [Vercel](https://vercel.com) पर लॉगिन करें और **Add New Project** पर क्लिक करें।
2. अपना GitHub रिपॉजिटरी सेलेक्ट करें।
3. **Root Directory** में `Edit` पर क्लिक करके `landing` सेलेक्ट करें।
4. **Environment Variables** (वैकल्पिक):
   - `VITE_APP_URL`: आपकी मुख्य ऐप का URL (जैसे `https://app.crackuex.com` या `https://ssc-prep.onrender.com`)
5. **Deploy** बटन दबाएं। `vercel.json` पहले से कॉन्फिगर है, सब कुछ ऑटोमैटिक चलेगा!

### विकल्प 2: Netlify पर डिप्लॉय
1. [Netlify](https://netlify.com) पर जाएं और **Add new site** > **Import an existing project** चुनें।
2. Base directory: `landing`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. `netlify.toml` और `_redirects` पहले से तैयार हैं।

### विकल्प 3: Cloudflare Pages
1. Cloudflare Dashboard में **Workers & Pages** > **Create application** > **Pages** चुनें।
2. Framework preset: **Vite**
3. Root directory: `/landing`
4. Build command: `npm run build`
5. Build output directory: `dist`

---

## 🔗 Main Web App से कैसे कनेक्ट करें (Linking with App)

जब यूजर Landing Page पर **"Start Free Mock Test"**, **"Go to App"**, या **"Sign In"** पर क्लिक करता है, तो वह मुख्य ऐप पर रीडायरेक्ट हो जाता है।

आप अपनी मुख्य ऐप का डोमेन सेट करने के लिए `.env` फाइल या होस्टिंग प्रोवाइडर के Environment Variables में यह जोड़ें:
```env
VITE_APP_URL=https://app.yourdomain.com
```
अगर आप कुछ भी सेट नहीं करते हैं, तो लोकल में यह ऑटोमैटिक `http://localhost:5173` पर और प्रोडक्शन में `/` पर जाएगा।
