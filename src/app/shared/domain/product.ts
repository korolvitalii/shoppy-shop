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
