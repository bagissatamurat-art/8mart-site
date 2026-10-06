// Импорт филиалов 8mart.kz → lib/branches.snapshot.json (сырой ответ API, без преобразований).
// Перевод в города и точки самовывоза — lib/branches.ts (он же переводит живые данные в /api/branches).
// Запуск: node scripts/import-branches.mjs
import { writeFileSync } from 'node:fs';

const API = 'https://dukenfy-api.8mart.kz/api/v1';
const res = await fetch(`${API}/public/branches`);
if (!res.ok) throw new Error(`API ${res.status}`);
const branches = await res.json();
const date = new Date().toISOString().slice(0, 10);
writeFileSync(new URL('../lib/branches.snapshot.json', import.meta.url), JSON.stringify({ source: `${API}/public/branches`, date, branches }, null, 2) + '\n');
console.log(`branches: ${branches.length} филиалов → lib/branches.snapshot.json`);
