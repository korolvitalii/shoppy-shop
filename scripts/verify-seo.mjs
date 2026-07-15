import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist/shoppy-shop/browser');
const origin = 'https://zeta.vercel.app';
const catalogue = JSON.parse(
  await readFile(resolve(root, 'src/app/features/catalogue/data/catalogue.json'), 'utf8'),
);
const locales = JSON.parse(await readFile(resolve(root, 'src/locale/locales.json'), 'utf8'));
const paths = [
  '/products',
  ...catalogue.groups.map((group) => `/products/${group.id}`),
  ...catalogue.products.map((product) => `/products/${product.groupId}/${product.id}`),
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const locale of locales) {
  const shell = await readFile(resolve(output, locale.path, 'index.csr.html'), 'utf8');
  assert(shell.includes('content="noindex,follow"'), `${locale.path} CSR shell must be noindex`);
  for (const path of paths) {
    const file = resolve(output, locale.path, path.slice(1), 'index.html');
    await access(file);
    const html = await readFile(file, 'utf8');
    assert(html.includes(`<html lang="${locale.locale}"`), `${file} has wrong lang`);
    assert(
      html.includes(`rel="canonical" href="${origin}/${locale.path}${path}"`),
      `${file} lacks canonical`,
    );
    assert(html.includes('content="index,follow"'), `${file} must be indexable`);
    for (const alternate of locales) {
      assert(
        html.includes(`hreflang="${alternate.hreflang}"`),
        `${file} lacks ${alternate.hreflang}`,
      );
    }
    assert(html.includes('application/ld+json'), `${file} lacks structured data`);
  }
}

const productHtml = await readFile(
  resolve(
    output,
    (locales.find((locale) => locale.default) ?? locales[0]).path,
    'products/beauty/beauty-1/index.html',
  ),
  'utf8',
);
assert(productHtml.includes('"@type":"Product"'), 'Product JSON-LD is missing');
assert(productHtml.includes('Refined Ceramic Table'), 'Prerendered product content is missing');
const sitemap = await readFile(resolve(output, 'sitemap.xml'), 'utf8');
const expectedCount = paths.length * locales.length;
assert(
  (sitemap.match(/<url>/g) ?? []).length === expectedCount,
  `Sitemap must contain ${expectedCount} URLs`,
);
for (const path of paths) {
  for (const locale of locales) {
    assert(
      sitemap.includes(`${origin}/${locale.path}${path}`),
      `Sitemap lacks ${locale.path}${path}`,
    );
  }
}
console.log(`SEO verification passed for ${expectedCount} localized prerendered pages.`);
