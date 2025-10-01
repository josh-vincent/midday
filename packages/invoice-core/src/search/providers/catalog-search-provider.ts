import type { SearchProvider, SearchResult, SearchOptions, LineItemMetadata } from '../types';

interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  unit?: string;
  category?: string;
  inStock?: boolean;
  imageUrl?: string;
}

export class CatalogSearchProvider implements SearchProvider {
  id = 'catalog';
  name = 'Product Catalog';
  
  constructor(
    private searchFunction: (query: string, options?: any) => Promise<CatalogItem[]>
  ) {}
  
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const items = await this.searchFunction(query, {
      limit: options?.limit || 10,
      ...options?.filters,
    });
    
    return items.map(item => ({
      id: item.id,
      title: item.name,
      subtitle: item.sku ? `SKU: ${item.sku}` : item.category,
      description: item.description,
      metadata: this.transformToLineItem({
        id: item.id,
        title: '',
        metadata: {} as LineItemMetadata,
        displayData: item,
      }),
      displayData: {
        price: item.price,
        unit: item.unit,
        inStock: item.inStock,
        imageUrl: item.imageUrl,
      },
    }));
  }
  
  transformToLineItem(result: SearchResult): LineItemMetadata {
    const item = result.displayData as CatalogItem;
    
    return {
      name: item.description || item.name,
      quantity: 1,
      price: item.price || 0,
      unit: item.unit,
      referenceId: item.id,
      referenceType: 'catalog_item',
      sku: item.sku,
    };
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
}