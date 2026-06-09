import { delay, http, HttpResponse } from 'msw';

import { mockProductGroups } from './data/product-groups';

export const handlers = [
  http.get('/api/product-groups', async () => {
    await delay(350);
    return HttpResponse.json(mockProductGroups);
  }),
];
