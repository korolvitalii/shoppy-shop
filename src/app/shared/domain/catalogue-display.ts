/**
 * Catalogue names in the selected language, for code that holds only a product or category ID — a
 * saved basket line, a search suggestion. The catalogue feature implements it and `app.config.ts`
 * binds it, so basket, checkout and the shell name catalogue entries without importing the
 * catalogue (which itself imports basket and favorites).
 */
export abstract class CatalogueDisplay {
  /** Every known category, in catalogue order. */
  abstract readonly categories: readonly CategoryName[];

  /** The category's name; an unknown ID is returned unchanged. */
  abstract categoryName(groupId: string): string;

  /**
   * The product's name in the selected language when `savedName` is one of that product's known
   * names in any language. Any other saved name — an edited or removed product — is kept.
   */
  abstract productName(productId: string, savedName: string): string;

  /** Copies of lines saved with a display name, each named in the selected language. */
  withProductNames<T extends ProductLine>(lines: readonly T[]): T[] {
    return lines.map((line) => ({ ...line, name: this.productName(line.productId, line.name) }));
  }
}

export interface CategoryName {
  readonly id: string;
  readonly name: string;
}

interface ProductLine {
  readonly productId: string;
  readonly name: string;
}
