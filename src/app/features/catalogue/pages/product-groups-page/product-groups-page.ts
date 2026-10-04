import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SeoService } from '../../../../core/seo/seo.service';
import { ProductGroupCard } from '../../components/product-group-card/product-group-card';
import { ProductGroupsRepository } from '../../data-access/product-groups.repository';
import { type ProductGroup } from '../../models/product-group';

type RequestStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-product-groups-page',
  imports: [ProductGroupCard],
  templateUrl: './product-groups-page.html',
  styleUrl: './product-groups-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupsPage {
  private readonly repository = inject(ProductGroupsRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);

  readonly groups = signal<readonly ProductGroup[]>([]);
  readonly status = signal<RequestStatus>('loading');

  constructor() {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    // On a hydrating page this emits twice: the groups the page was prerendered with, then the live
    // ones. Both go straight to 'success', so the prerendered grid is never swapped for a spinner.
    this.repository
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.status.set('success');
          this.applySeo();
        },
        error: () => this.status.set('error'),
      });
  }

  private applySeo(): void {
    const description = $localize`:@@seoProductsDescription:Explore thoughtfully selected products for everyday life and memorable journeys.`;
    this.seo.apply({
      title: $localize`:@@seoProductsTitle:Shop products`,
      description,
      path: '/products',
      indexable: true,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: $localize`:@@seoProductsCollectionName:ShoppyShop products`,
        description,
      },
    });
  }
}
