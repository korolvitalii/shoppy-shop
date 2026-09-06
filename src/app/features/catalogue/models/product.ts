import { type Product } from '../../../shared/domain/product';

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name';
export type PriceRange = 'all' | '0-50' | '50-200' | '200+';

export interface ProductSearchQuery {
  search: string;
  sort: ProductSort;
  price: PriceRange;
}

/**
 * One page of a listing. `nextCursor` is the only end-of-list signal — the API pages by keyset
 * rather than by page number, so it never reports a total count.
 */
export interface ProductPage {
  items: readonly Product[];
  nextCursor: string | null;
}

/**
 * `cursor` is an opaque token taken from a previous page's `nextCursor`. It is tied to the sort it
 * was issued under, so it must be dropped whenever the query changes.
 */
export interface ProductPageRequest {
  cursor?: string | null;
  limit?: number;
}
