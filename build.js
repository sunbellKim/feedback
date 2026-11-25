// Vercel 빌드 시 환경변수로 public/config.js 생성
const fs = require('fs');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync(
  'public/config.js',
  `window.APP_CONFIG = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key })};\n`
);
