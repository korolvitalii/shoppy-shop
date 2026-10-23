import { type Product } from '../../../shared/domain/product';
import catalogueText from '../data/catalogue.translations.json';
import { type ProductGroup } from '../models/product-group';

// Prerendering serves the bundled catalogue in the page's language, as the API answers `?locale=`.
// Import this only from the server-side Static repositories: anywhere else it puts the full
// catalogue text of every language into the browser bundle.

/** The product with its translated text, or unchanged when its source text no longer matches. */
export function localizedProduct<T extends Product>(product: T, locale: string): T {
  const text = translationsFor(locale)?.products.find((candidate) => candidate.id === product.id);
  if (!text || product.name !== text.sourceName || product.description !== text.sourceDescription)
    return product;
  return { ...product, name: text.name, description: text.description };
}

/** The group with its translated text, or unchanged when its source text no longer matches. */
export function localizedGroup(group: ProductGroup, locale: string): ProductGroup {
  const text = translationsFor(locale)?.groups.find((candidate) => candidate.id === group.id);
  if (
    !text ||
    group.name !== text.sourceName ||
    group.description !== text.sourceDescription ||
    group.badge !== text.sourceBadge
  )
    return group;
  return { ...group, name: text.name, description: text.description, badge: text.badge };
}

function translationsFor(locale: string) {
  return catalogueText.translations.find((text) => text.locale === locale);
}
