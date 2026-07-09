import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductCard } from '../../../catalogue/components/product-card/product-card';
import { FavoritesService } from '../../data-access/favorites.service';

@Component({
  selector: 'app-favorites-page',
  imports: [ProductCard, RouterLink],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage {
  protected readonly favorites = inject(FavoritesService);
}
