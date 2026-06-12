export interface Product {
  id: string;
  groupId: string;
  name: string;
  brand: string;
  description: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
}

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name';
export type PriceRange = 'all' | '0-50' | '50-200' | '200+';

export interface ProductSearchQuery {
  search: string;
  sort: ProductSort;
  price: PriceRange;
}
