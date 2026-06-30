import { faker } from '@faker-js/faker';

import { type ProductGroup } from '../../app/features/catalogue/models/product-group';

faker.seed(20260609);

export const mockProductGroups: readonly ProductGroup[] = [
  {
    id: 'beauty',
    name: 'Beauty & fragrance',
    description: 'Signature scents, skincare rituals, and considered beauty essentials.',
    imageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80',
    itemCount: faker.number.int({ min: 18, max: 34 }),
    badge: 'Editor’s pick',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Headphones, smart accessories, and technology designed for life on the move.',
    imageUrl:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80',
    itemCount: faker.number.int({ min: 20, max: 42 }),
    badge: 'Popular',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    description: 'Modern wardrobe pieces selected for versatility, comfort, and lasting style.',
    imageUrl:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
    itemCount: faker.number.int({ min: 24, max: 48 }),
    badge: null,
  },
  {
    id: 'home',
    name: 'Home & living',
    description: 'Objects with warmth and character for calm, expressive everyday spaces.',
    imageUrl:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    itemCount: faker.number.int({ min: 16, max: 38 }),
    badge: 'New',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Bags, eyewear, and finishing details that make an outfit distinctly yours.',
    imageUrl:
      'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1200&q=80',
    itemCount: faker.number.int({ min: 14, max: 32 }),
    badge: null,
  },
  {
    id: 'gifts',
    name: 'Gifts',
    description: 'Thoughtful finds for celebrations, thank-yous, and spontaneous surprises.',
    imageUrl:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80',
    itemCount: faker.number.int({ min: 12, max: 28 }),
    badge: 'Gift guide',
  },
];
