import type { SearchProvider, SearchResult, SearchOptions, LineItemMetadata } from '../types';

interface Job {
  id: string;
  jobNumber: string;
  companyName?: string;
  addressSite?: string;
  materialType?: string;
  equipmentType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  status: string;
  customerId?: string;
}

export class JobSearchProvider implements SearchProvider {
  id = 'jobs';
  name = 'Jobs';
  
  constructor(
    private searchFunction: (query: string, options?: any) => Promise<Job[]>
  ) {}
  
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const jobs = await this.searchFunction(query, {
      customerId: options?.customerId,
      limit: options?.limit || 10,
    });
    
    return jobs.map(job => ({
      id: job.id,
      title: `Job #${job.jobNumber}`,
      subtitle: job.companyName,
      description: [
        job.addressSite,
        job.materialType,
        job.equipmentType
      ].filter(Boolean).join(' • '),
      metadata: this.transformToLineItem({
        id: job.id,
        title: '',
        metadata: {} as LineItemMetadata,
        displayData: job,
      }),
      displayData: {
        status: job.status,
        total: job.pricePerUnit && job.cubicMetreCapacity 
          ? job.pricePerUnit * job.cubicMetreCapacity 
          : null,
        priceBreakdown: job.cubicMetreCapacity && job.pricePerUnit
          ? `${job.cubicMetreCapacity} m³ × $${job.pricePerUnit}`
          : null,
      },
    }));
  }
  
  transformToLineItem(result: SearchResult): LineItemMetadata {
    const job = result.displayData as Job;
    
    return {
      name: `Job #${job.jobNumber}${job.addressSite ? ` - ${job.addressSite}` : ''}${job.materialType ? ` - ${job.materialType}` : ''}`,
      quantity: job.cubicMetreCapacity || 1,
      price: job.pricePerUnit || 0,
      unit: job.cubicMetreCapacity ? 'm³' : undefined,
      referenceId: job.id,
      referenceType: 'job',
      // Extended fields for dirt tracking
      materialType: job.materialType,
      addressSite: job.addressSite,
      equipmentType: job.equipmentType,
    };
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
}