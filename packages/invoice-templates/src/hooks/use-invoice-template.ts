import { useState, useCallback, useEffect } from "react";
import type { InvoiceTemplate } from "../types/template";
import type { TemplateProvider } from "../providers/template-provider";
import type { AutoPopulateOptions, InvoiceFormData } from "../auto-populate/auto-populator";
import { InvoiceAutoPopulator } from "../auto-populate/auto-populator";

export interface UseInvoiceTemplateOptions {
  provider: TemplateProvider;
  autoLoad?: boolean;
  templateId?: string;
  customerId?: string;
  jobIds?: string[];
}

export interface UseInvoiceTemplateReturn {
  // Templates
  templates: InvoiceTemplate[];
  currentTemplate: InvoiceTemplate | null;
  isLoadingTemplates: boolean;
  
  // Form data
  formData: InvoiceFormData | null;
  isPopulating: boolean;
  
  // Actions
  loadTemplates: () => Promise<void>;
  selectTemplate: (templateId: string) => Promise<void>;
  populateInvoice: (options?: AutoPopulateOptions) => Promise<InvoiceFormData>;
  updateFormData: (updates: Partial<InvoiceFormData>) => void;
  saveTemplate: (template: Partial<InvoiceTemplate>) => Promise<InvoiceTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
  
  // Utilities
  recalculateTotals: () => void;
  generateNextInvoiceNumber: () => Promise<string>;
}

export function useInvoiceTemplate(
  options: UseInvoiceTemplateOptions
): UseInvoiceTemplateReturn {
  const { provider, autoLoad = true, templateId, customerId, jobIds } = options;
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplate | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  
  const autoPopulator = new InvoiceAutoPopulator(provider);
  
  // Load templates on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [autoLoad]);
  
  // Load specific template if templateId is provided
  useEffect(() => {
    if (templateId) {
      selectTemplate(templateId);
    }
  }, [templateId]);
  
  // Auto-populate when customerId or jobIds change
  useEffect(() => {
    if (customerId || jobIds?.length) {
      populateInvoice({ customerId, jobIds });
    }
  }, [customerId, jobIds?.join(",")]);
  
  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const loadedTemplates = await provider.listTemplates();
      setTemplates(loadedTemplates);
      
      // Set default template as current if none selected
      if (!currentTemplate) {
        const defaultTemplate = loadedTemplates.find(t => t.isDefault);
        if (defaultTemplate) {
          setCurrentTemplate(defaultTemplate);
        }
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [provider, currentTemplate]);
  
  const selectTemplate = useCallback(async (templateId: string) => {
    try {
      const template = await provider.getTemplate(templateId);
      if (template) {
        setCurrentTemplate(template);
        
        // Auto-populate with new template
        if (formData) {
          await populateInvoice({ templateId });
        }
      }
    } catch (error) {
      console.error("Failed to select template:", error);
    }
  }, [provider, formData]);
  
  const populateInvoice = useCallback(async (
    options: AutoPopulateOptions = {}
  ): Promise<InvoiceFormData> => {
    setIsPopulating(true);
    try {
      const populatedData = await autoPopulator.populateInvoice({
        templateId: options.templateId || currentTemplate?.id,
        customerId: options.customerId || customerId,
        jobIds: options.jobIds || jobIds,
        overrides: options.overrides,
      });
      
      setFormData(populatedData);
      return populatedData;
    } catch (error) {
      console.error("Failed to populate invoice:", error);
      throw error;
    } finally {
      setIsPopulating(false);
    }
  }, [autoPopulator, currentTemplate, customerId, jobIds]);
  
  const updateFormData = useCallback((updates: Partial<InvoiceFormData>) => {
    setFormData(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);
  
  const recalculateTotals = useCallback(async () => {
    if (!formData) return;
    
    const updated = await autoPopulator.updateCalculations(formData);
    setFormData(prev => {
      if (!prev) return null;
      return { ...prev, ...updated };
    });
  }, [autoPopulator, formData]);
  
  const saveTemplate = useCallback(async (
    template: Partial<InvoiceTemplate>
  ): Promise<InvoiceTemplate> => {
    try {
      let saved: InvoiceTemplate;
      
      if (template.id) {
        saved = await provider.updateTemplate(template.id, template);
      } else {
        saved = await provider.createTemplate(template);
      }
      
      // Reload templates
      await loadTemplates();
      
      return saved;
    } catch (error) {
      console.error("Failed to save template:", error);
      throw error;
    }
  }, [provider, loadTemplates]);
  
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await provider.deleteTemplate(templateId);
      
      // Clear current template if it was deleted
      if (currentTemplate?.id === templateId) {
        setCurrentTemplate(null);
      }
      
      // Reload templates
      await loadTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      throw error;
    }
  }, [provider, currentTemplate, loadTemplates]);
  
  const generateNextInvoiceNumber = useCallback(async (): Promise<string> => {
    if (currentTemplate) {
      return provider.generateInvoiceNumber(currentTemplate);
    }
    
    // Fallback to date-based number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV${year}${month}${random}`;
  }, [provider, currentTemplate]);
  
  return {
    templates,
    currentTemplate,
    isLoadingTemplates,
    formData,
    isPopulating,
    loadTemplates,
    selectTemplate,
    populateInvoice,
    updateFormData,
    saveTemplate,
    deleteTemplate,
    recalculateTotals,
    generateNextInvoiceNumber,
  };
}