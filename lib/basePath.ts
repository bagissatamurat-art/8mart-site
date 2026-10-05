// Префикс путей, если сайт живёт не в корне домена (NEXT_PUBLIC_BASE_PATH). На Vercel и локально — пусто.
// next/link и router сами добавляют basePath; этот хелпер — для <img src>, iframe и абсолютных ссылок.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const asset = (path: string): string => (path.startsWith('/') && !path.startsWith('//') ? BASE_PATH + path : path);
