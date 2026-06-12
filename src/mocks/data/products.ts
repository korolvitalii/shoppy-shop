import { faker } from '@faker-js/faker';

import { Product } from '../../app/features/catalogue/models/product';

faker.seed(20260612);

const groups = ['beauty', 'electronics', 'fashion', 'home', 'accessories', 'gifts'];

export const mockProducts: readonly Product[] = groups.flatMap((groupId) =>
  Array.from({ length: 9 }, (_, index): Product => {
    const price = faker.number.float({ min: 18, max: 420, fractionDigits: 2 });
    const onSale = index % 3 === 0;
    return {
      id: `${groupId}-${index + 1}`,
      groupId,
      name: faker.commerce.productName(),
      brand: faker.company.name(),
      description: faker.commerce.productDescription(),
      imageUrl: `https://picsum.photos/seed/shoppyshop-${groupId}-${index}/800/600`,
      price,
      salePrice: onSale ? Number((price * 0.8).toFixed(2)) : null,
      inStock: index !== 8,
    };
  }),
);
