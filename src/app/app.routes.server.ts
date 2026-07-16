import { RenderMode, type ServerRoute } from '@angular/ssr';

import catalogue from './features/catalogue/data/catalogue.json';

export const serverRoutes: ServerRoute[] = [
  { path: 'products/search', renderMode: RenderMode.Client },
  {
    path: 'products/:groupId/:productId',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return catalogue.products.map(({ groupId, id }) => ({ groupId, productId: id }));
    },
  },
  {
    path: 'products/:groupId',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return catalogue.groups.map(({ id }) => ({ groupId: id }));
    },
  },
  { path: 'products', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
