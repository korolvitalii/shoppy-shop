export type SeoStructuredData = Record<string, unknown> | readonly Record<string, unknown>[];

export interface SeoPageDefinition {
  title: string;
  description: string;
  path: string;
  image?: string;
  indexable: boolean;
  type?: 'website' | 'product';
  structuredData?: SeoStructuredData;
}
