import type { InvoiceTemplate, TemplateCategory } from "../../types/template";

// Import regional templates
export * from "./australia";
export * from "./united-states";

// Template registry
export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  region: string;
  template: Partial<InvoiceTemplate>;
}

// Import all templates
import {
  australianStandardTemplate,
  australianConstructionTemplate,
  australianServiceTemplate,
  australianRetailTemplate,
} from "./australia";

import {
  usStandardTemplate,
  usFreelanceTemplate,
  usContractorTemplate,
  usSaaSTemplate,
} from "./united-states";

// Export template presets registry
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // Australian templates
  {
    id: "au-standard",
    name: "Australian Standard",
    description: "Standard invoice for Australian businesses",
    category: TemplateCategory.STANDARD,
    region: "AU",
    template: australianStandardTemplate,
  },
  {
    id: "au-construction",
    name: "Australian Construction",
    description: "Construction and dirt moving invoice",
    category: TemplateCategory.CONSTRUCTION,
    region: "AU",
    template: australianConstructionTemplate,
  },
  {
    id: "au-service",
    name: "Australian Service",
    description: "Service business invoice",
    category: TemplateCategory.SERVICE,
    region: "AU",
    template: australianServiceTemplate,
  },
  {
    id: "au-retail",
    name: "Australian Retail",
    description: "Retail business invoice",
    category: TemplateCategory.PRODUCT,
    region: "AU",
    template: australianRetailTemplate,
  },
  
  // US templates
  {
    id: "us-standard",
    name: "US Standard",
    description: "Standard invoice for US businesses",
    category: TemplateCategory.STANDARD,
    region: "US",
    template: usStandardTemplate,
  },
  {
    id: "us-freelance",
    name: "US Freelance",
    description: "Freelance and consulting invoice",
    category: TemplateCategory.FREELANCE,
    region: "US",
    template: usFreelanceTemplate,
  },
  {
    id: "us-contractor",
    name: "US Contractor",
    description: "Contractor and construction invoice",
    category: TemplateCategory.CONSTRUCTION,
    region: "US",
    template: usContractorTemplate,
  },
  {
    id: "us-saas",
    name: "US SaaS",
    description: "Software subscription invoice",
    category: TemplateCategory.SUBSCRIPTION,
    region: "US",
    template: usSaaSTemplate,
  },
];

// Helper functions
export function getTemplatePresets(region?: string, category?: TemplateCategory): TemplatePreset[] {
  return TEMPLATE_PRESETS.filter(preset => {
    if (region && preset.region !== region) return false;
    if (category && preset.category !== category) return false;
    return true;
  });
}

export function getTemplatePreset(id: string): TemplatePreset | undefined {
  return TEMPLATE_PRESETS.find(preset => preset.id === id);
}