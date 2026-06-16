import { computed, Injectable, signal } from '@angular/core';
import { z } from 'zod/mini';

import { Product } from '../../catalogue/models/product';
import { BasketItem } from '../models/basket-item';

const STORAGE_KEY = 'shoppyshop.basket.v1';
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

@Injectable({ providedIn: 'root' })
export class BasketService {
  private readonly itemsState = signal<readonly BasketItem[]>(this.restore());

  readonly items = this.itemsState.asReadonly();
  readonly itemCount = computed(() =>
    this.itemsState().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.itemsState().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );

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
    this.itemsState.set(items);
    this.persist(items);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    const items = this.itemsState().map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    );
    this.itemsState.set(items);
    this.persist(items);
  }

  remove(productId: string): void {
    const items = this.itemsState().filter((item) => item.productId !== productId);
    this.itemsState.set(items);
    this.persist(items);
  }

  private restore(): readonly BasketItem[] {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return [];
      const result = basketSchema.safeParse(JSON.parse(value) as unknown);
      return result.success ? result.data : [];
    } catch {
      return [];
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
