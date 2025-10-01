import type { LineItem, Template } from "../types";

/**
 * Apply automatic itemization rules to line items
 * This function determines which items should be grouped and have their details hidden
 * based on the configured auto-grouping rules
 */
export function applyAutoItemizationRules(
  lineItems: LineItem[],
  template: Template
): LineItem[] {
  // If auto-grouping is not enabled, return items as-is
  if (!template.autoGroupingRules?.enabled) {
    return lineItems;
  }

  const rules = template.autoGroupingRules;
  const processedItems = [...lineItems];
  
  // Track items to be grouped
  const itemsToGroup = new Set<number>();
  const nameGroups = new Map<string, number[]>();

  processedItems.forEach((item, index) => {
    // Skip if item already has explicit showDetails setting
    if (item.showDetails !== undefined) {
      return;
    }

    let shouldGroup = false;

    // Rule 1: Group items below price threshold
    if (rules.groupBelowPrice !== undefined && item.price !== undefined) {
      if (item.price < rules.groupBelowPrice) {
        shouldGroup = true;
      }
    }

    // Rule 2: Group items with quantity of 1
    if (rules.groupSingleQuantity && item.quantity === 1) {
      shouldGroup = true;
    }

    // Rule 3: Group items matching certain patterns
    if (rules.groupByPattern && rules.groupByPattern.length > 0) {
      const itemName = item.name.toLowerCase();
      const matchesPattern = rules.groupByPattern.some(pattern => {
        const regex = new RegExp(pattern.toLowerCase());
        return regex.test(itemName);
      });
      if (matchesPattern) {
        shouldGroup = true;
      }
    }

    // Rule 4: Group items with the same name
    if (rules.groupByName) {
      const nameLower = item.name.toLowerCase().trim();
      if (!nameGroups.has(nameLower)) {
        nameGroups.set(nameLower, []);
      }
      nameGroups.get(nameLower)!.push(index);
    }

    if (shouldGroup) {
      itemsToGroup.add(index);
    }
  });

  // Process items that should be grouped by name
  if (rules.groupByName) {
    nameGroups.forEach((indices) => {
      // Only group if there are multiple items with the same name
      if (indices.length > 1) {
        indices.forEach(index => itemsToGroup.add(index));
      }
    });
  }

  // Apply the grouping decisions
  itemsToGroup.forEach(index => {
    // Set showDetails to false for grouped items
    processedItems[index] = {
      ...processedItems[index],
      showDetails: rules.autoHideDetails !== false ? false : undefined,
      // Assign a default groupId if not already set
      groupId: processedItems[index].groupId || 'auto-grouped'
    };
  });

  return processedItems;
}

/**
 * Helper function to determine if an item should be automatically grouped
 * based on its properties and the configured rules
 */
export function shouldAutoGroup(
  item: LineItem,
  rules: Template['autoGroupingRules']
): boolean {
  if (!rules?.enabled) {
    return false;
  }

  // Check price threshold
  if (rules.groupBelowPrice !== undefined && item.price !== undefined) {
    if (item.price < rules.groupBelowPrice) {
      return true;
    }
  }

  // Check single quantity
  if (rules.groupSingleQuantity && item.quantity === 1) {
    return true;
  }

  // Check pattern matching
  if (rules.groupByPattern && rules.groupByPattern.length > 0) {
    const itemName = item.name.toLowerCase();
    const matchesPattern = rules.groupByPattern.some(pattern => {
      const regex = new RegExp(pattern.toLowerCase());
      return regex.test(itemName);
    });
    if (matchesPattern) {
      return true;
    }
  }

  return false;
}

/**
 * Get suggested grouping rules based on analysis of line items
 * This can help users configure appropriate auto-grouping settings
 */
export function suggestGroupingRules(lineItems: LineItem[]): Template['autoGroupingRules'] {
  // Analyze items to suggest rules
  const prices = lineItems.map(item => item.price).filter(p => p !== undefined) as number[];
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const minPrice = Math.min(...prices);
  
  // Count items with quantity of 1
  const singleQuantityCount = lineItems.filter(item => item.quantity === 1).length;
  const singleQuantityPercentage = (singleQuantityCount / lineItems.length) * 100;
  
  // Find common name patterns
  const namePatterns = new Map<string, number>();
  lineItems.forEach(item => {
    const words = item.name.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 chars
        namePatterns.set(word, (namePatterns.get(word) || 0) + 1);
      }
    });
  });
  
  // Get most common patterns (appearing in >30% of items)
  const commonPatterns = Array.from(namePatterns.entries())
    .filter(([_, count]) => count > lineItems.length * 0.3)
    .map(([pattern]) => pattern);

  return {
    enabled: true,
    // Suggest grouping items below 20% of average price
    groupBelowPrice: avgPrice * 0.2,
    // Enable single quantity grouping if >50% of items have quantity of 1
    groupSingleQuantity: singleQuantityPercentage > 50,
    // Group by name if there are duplicates
    groupByName: new Set(lineItems.map(i => i.name.toLowerCase())).size < lineItems.length,
    // Suggest common patterns
    groupByPattern: commonPatterns.length > 0 ? commonPatterns : undefined,
    autoHideDetails: true
  };
}