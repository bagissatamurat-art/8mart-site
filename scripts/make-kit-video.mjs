// Демо-ролик для витрины /kit («Видео товара»): медленный наезд на public/assets/st-flowers.jpg и тихий аккорд.
// Те же три файла, что делает сервер (worker бэкенда): ролик со звуком, беззвучное превью 6 с, обложка — первый кадр.
// Запуск (нужен ffmpeg): node scripts/make-kit-video.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const OUT = 'public/kit';
mkdirSync(OUT, { recursive: true });
const ff = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const tone = f => ['-f', 'lavfi', '-i', `sine=frequency=${f}:sample_rate=48000`];

// 8 с, 30 к/с, 360×640: наезд от 1 до 1,15 по центру; звук — до, ми, соль тихо, с нарастанием и затуханием.
ff('-loop', '1', '-i', 'public/assets/st-flowers.jpg', ...tone(523.25), ...tone(659.25), ...tone(783.99),
  '-filter_complex', "[0:v]scale=1440:2560,zoompan=z='min(zoom+0.0006,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=240:s=360x640:fps=30,format=yuv420p[v];"
    + '[1:a][2:a][3:a]amix=inputs=3,volume=0.15,afade=t=in:d=1,afade=t=out:st=7:d=1[a]',
  '-map', '[v]', '-map', '[a]', '-t', '8', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-maxrate', '600k', '-bufsize', '1200k',
  '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', '-map_metadata', '-1', `${OUT}/video-demo.mp4`);
ff('-i', `${OUT}/video-demo.mp4`, '-t', '6', '-an', '-vf', 'fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
  '-movflags', '+faststart', '-map_metadata', '-1', `${OUT}/video-demo-preview.mp4`);
ff('-i', `${OUT}/video-demo.mp4`, '-frames:v', '1', '-q:v', '4', `${OUT}/video-demo-poster.jpg`);
console.log(`${OUT}: video-demo.mp4, video-demo-preview.mp4, video-demo-poster.jpg`);
