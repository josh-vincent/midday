import type { SearchProvider, SearchResult, SearchOptions, LineItemMetadata } from '../types';

interface Service {
  id: string;
  name: string;
  description?: string;
  hourlyRate?: number;
  flatRate?: number;
  estimatedHours?: number;
  category?: string;
  skillLevel?: 'junior' | 'mid' | 'senior' | 'expert';
}

export class ServiceSearchProvider implements SearchProvider {
  id = 'services';
  name = 'Services';
  
  constructor(
    private searchFunction: (query: string, options?: any) => Promise<Service[]>
  ) {}
  
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const services = await this.searchFunction(query, {
      limit: options?.limit || 10,
      ...options?.filters,
    });
    
    return services.map(service => ({
      id: service.id,
      title: service.name,
      subtitle: service.category,
      description: service.description,
      metadata: this.transformToLineItem({
        id: service.id,
        title: '',
        metadata: {} as LineItemMetadata,
        displayData: service,
      }),
      displayData: {
        rate: service.hourlyRate || service.flatRate,
        rateType: service.hourlyRate ? 'hourly' : 'flat',
        estimatedHours: service.estimatedHours,
        skillLevel: service.skillLevel,
        estimatedTotal: service.hourlyRate && service.estimatedHours
          ? service.hourlyRate * service.estimatedHours
          : service.flatRate,
      },
    }));
  }
  
  transformToLineItem(result: SearchResult): LineItemMetadata {
    const service = result.displayData as Service;
    
    const quantity = service.estimatedHours || 1;
    const price = service.hourlyRate || service.flatRate || 0;
    const unit = service.hourlyRate ? 'hours' : undefined;
    
    return {
      name: service.description || service.name,
      quantity,
      price,
      unit,
      referenceId: service.id,
      referenceType: 'service',
      category: service.category,
      skillLevel: service.skillLevel,
    };
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
}