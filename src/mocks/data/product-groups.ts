import catalogue from '../../app/features/catalogue/data/catalogue.json';
import { type ProductGroup } from '../../app/features/catalogue/models/product-group';

export const mockProductGroups: readonly ProductGroup[] = catalogue.groups;
