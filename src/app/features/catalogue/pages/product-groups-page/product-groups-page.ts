import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

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
    this.repository
      .getAll()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.status.set('success');
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
        },
        error: () => this.status.set('error'),
      });
  }
}
