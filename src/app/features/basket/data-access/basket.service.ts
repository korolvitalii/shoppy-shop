import { computed, Injectable, signal } from '@angular/core';

import { type Product } from '../../catalogue/models/product';
import { type BasketItem } from '../models/basket-item';

const STORAGE_KEY = 'shoppyshop.basket.v1';

@Injectable({ providedIn: 'root' })
export class BasketService {
  private readonly itemsState = signal<readonly BasketItem[]>([]);
  private revision = 0;

  readonly items = this.itemsState.asReadonly();
  readonly itemCount = computed(() =>
    this.itemsState().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.itemsState().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );

  constructor() {
    void this.restore();
  }

  add(product: Product, quantity = 1): void {
    const current = this.itemsState();
    const existing = current.find((item) => item.productId === product.id);
    const items = existing
      ? current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      : [
          ...current,
          {
            productId: product.id,
            groupId: product.groupId,
            name: product.name,
            imageUrl: product.imageUrl,
            unitPrice: product.salePrice ?? product.price,
            quantity,
          },
        ];
    this.commit(items);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this.commit(
      this.itemsState().map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  remove(productId: string): void {
    this.commit(this.itemsState().filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.commit([]);
  }

  private commit(items: readonly BasketItem[]): void {
    this.revision += 1;
    this.itemsState.set(items);
    this.persist(items);
  }

  private async restore(): Promise<void> {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return;
      const initialRevision = this.revision;
      const { z } = await import('zod/mini');
      const basketSchema = z.array(
        z.object({
          productId: z.string().check(z.minLength(1)),
          groupId: z.string().check(z.minLength(1)),
          name: z.string().check(z.minLength(1)),
          imageUrl: z.string().check(z.minLength(1)),
          unitPrice: z.number().check(z.nonnegative()),
          quantity: z.int().check(z.positive()),
        }),
      );
      const result = basketSchema.safeParse(JSON.parse(value) as unknown);
      if (result.success && this.revision === initialRevision) {
        this.itemsState.set(result.data);
      }
    } catch {
      // Invalid or unavailable storage is treated as an empty basket.
    }
  }

  private persist(items: readonly BasketItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The in-memory basket remains usable when storage is unavailable or full.
    }
  }
}
