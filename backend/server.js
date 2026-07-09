import dotenv from 'dotenv';
import { connectDB } from './src/config/db.config.js';
import { createApp } from './src/app.js';

dotenv.config();

connectDB();

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Production server boot complete on http://localhost:${PORT}`);
});
