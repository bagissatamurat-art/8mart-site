import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Пакет дизайна лежит рядом с кодом; при сборке его не трогаем.
  outputFileTracingExcludes: { '*': ['design_handoff_8mart_site/**'] },
};

export default nextConfig;
