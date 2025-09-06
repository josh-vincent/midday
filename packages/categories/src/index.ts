// Stub for categories package
export const CATEGORIES = [];
export const getTaxTypeForCountry = (country: string) => "tax";
export const getTaxRateForCategory = (category: string, country: string) => 0;
export const CategoryEmbeddings = class CategoryEmbeddings {
  constructor(config: any) {}
  findCategory(text: string) {
    return null;
  }
};
export default {};
