import { computed, Injectable, signal } from '@angular/core';

import { type Product } from '../../catalogue/models/product';

const STORAGE_KEY = 'shoppyshop.favorites.v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly productsState = signal<readonly Product[]>([]);
  private revision = 0;

  readonly products = this.productsState.asReadonly();
  readonly count = computed(() => this.productsState().length);
  readonly productIds = computed(() => new Set(this.productsState().map((product) => product.id)));

  constructor() {
    void this.restore();
  }

  has(productId: string): boolean {
    return this.productIds().has(productId);
  }

  toggle(product: Product): void {
    if (this.has(product.id)) {
      this.remove(product.id);
      return;
    }
    this.commit([...this.productsState(), product]);
  }

  remove(productId: string): void {
    this.commit(this.productsState().filter((product) => product.id !== productId));
  }

  clear(): void {
    this.commit([]);
  }

  private commit(products: readonly Product[]): void {
    this.revision += 1;
    this.productsState.set(products);
    this.persist(products);
  }

  private async restore(): Promise<void> {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return;
      const initialRevision = this.revision;
      const { z } = await import('zod/mini');
      const productSchema = z.object({
        id: z.string().check(z.minLength(1)),
        groupId: z.string().check(z.minLength(1)),
        name: z.string().check(z.minLength(1)),
        brand: z.string().check(z.minLength(1)),
        description: z.string(),
        imageUrl: z.string().check(z.minLength(1)),
        price: z.number().check(z.nonnegative()),
        salePrice: z.nullable(z.number().check(z.nonnegative())),
        inStock: z.boolean(),
      });
      const result = z.array(productSchema).safeParse(JSON.parse(value) as unknown);
      if (result.success && this.revision === initialRevision) {
        this.productsState.set(result.data);
      }
    } catch {
      // Invalid or unavailable storage is treated as an empty favourites list.
    }
  }

  private persist(products: readonly Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Favourites remain available in memory when storage is unavailable or full.
    }
  }
}
