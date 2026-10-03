import { type Product } from '../../../shared/domain/product';

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name';
export type PriceRange = 'all' | '0-50' | '50-200' | '200+';

export interface ProductSearchQuery {
  search: string;
  sort: ProductSort;
  price: PriceRange;
  inStock: boolean;
  isNew: boolean;
  giftWrappable: boolean;
}

/** The unfiltered catalogue in its featured order. */
export const DEFAULT_PRODUCT_SEARCH_QUERY: Readonly<ProductSearchQuery> = {
  search: '',
  sort: 'featured',
  price: 'all',
  inStock: false,
  isNew: false,
  giftWrappable: false,
};

/**
 * One page of a listing. `nextCursor` is the only end-of-list signal — the API pages by keyset
 * rather than by page number, so it never reports a total count on every page. `totalCount` is the
 * one exception: it is only populated on the first page of a given filter set (a null `cursor` on
 * the request), so the UI can show "Showing X of Y" without paying for a count on every "load more".
 */
export interface ProductPage {
  items: readonly Product[];
  nextCursor: string | null;
  totalCount: number | null;
}

/**
 * `cursor` is an opaque token taken from a previous page's `nextCursor`. It is tied to the sort it
 * was issued under, so it must be dropped whenever the query changes.
 */
export interface ProductPageRequest {
  cursor?: string | null;
  limit?: number;
}
