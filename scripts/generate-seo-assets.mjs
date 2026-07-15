import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist/shoppy-shop/browser');
const origin = 'https://zeta.vercel.app';
const catalogue = JSON.parse(
  await readFile(resolve(root, 'src/app/features/catalogue/data/catalogue.json'), 'utf8'),
);
const locales = JSON.parse(await readFile(resolve(root, 'src/locale/locales.json'), 'utf8'));
const defaultLocale = locales.find((locale) => locale.default) ?? locales[0];
const paths = [
  '/products',
  ...catalogue.groups.map((group) => `/products/${group.id}`),
  ...catalogue.products.map((product) => `/products/${product.groupId}/${product.id}`),
];

const entries = paths
  .flatMap((path) =>
    locales.map(
      (locale) => `  <url>
    <loc>${origin}/${locale.path}${path}</loc>
${locales.map((alternate) => `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${origin}/${alternate.path}${path}" />`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/${defaultLocale.path}${path}" />
  </url>`,
    ),
  )
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
const disallowed = ['login', 'favorites', 'basket', 'checkout', 'orders', 'products/search'];
const robots = `User-agent: *
${locales.flatMap((locale) => disallowed.map((path) => `Disallow: /${locale.path}/${path}`)).join('\n')}

Sitemap: ${origin}/sitemap.xml
`;

await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(resolve(output, 'sitemap.xml'), sitemap),
  writeFile(resolve(output, 'robots.txt'), robots),
  copyFile(resolve(root, 'public/social-preview.svg'), resolve(output, 'social-preview.svg')),
]);
console.log(
  `Generated sitemap.xml with ${paths.length * locales.length} localized URLs and robots.txt.`,
);
