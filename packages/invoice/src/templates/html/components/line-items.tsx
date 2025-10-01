import { formatAmount } from "@midday/utils/format";
import type { LineItem, Template } from "../../../types";
import { calculateLineItemTotal } from "../../../utils/calculate";
import { applyAutoItemizationRules } from "../../../utils/auto-itemization";
import { Description } from "./description";

type Props = {
  lineItems: LineItem[];
  currency: string | null;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  includeDecimals?: boolean;
  locale: string;
  includeUnits?: boolean;
  includeItemDetails?: boolean;
  groupConsolidatedItems?: boolean;
  consolidatedItemLabel?: string;
  template?: Template;
};

export function LineItems({
  lineItems,
  currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
  includeDecimals = false,
  includeUnits = false,
  locale,
  includeItemDetails = true,
  groupConsolidatedItems = false,
  consolidatedItemLabel = "Services",
  template,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  // Apply auto-itemization rules if template is provided
  const autoProcessedItems = template 
    ? applyAutoItemizationRules(lineItems, template)
    : lineItems;

  // Process line items based on itemization settings
  const processedItems = (() => {
    if (!groupConsolidatedItems) {
      // Show all items based on their individual showDetails flag
      return autoProcessedItems;
    }

    // Group items by groupId or showDetails flag
    const detailedItems: LineItem[] = [];
    const consolidatedGroups = new Map<string, LineItem[]>();
    
    autoProcessedItems.forEach(item => {
      if (item.showDetails !== false) {
        detailedItems.push(item);
      } else {
        const groupId = item.groupId || 'default';
        const existing = consolidatedGroups.get(groupId) || [];
        existing.push(item);
        consolidatedGroups.set(groupId, existing);
      }
    });

    // Create consolidated items
    const consolidatedItems: LineItem[] = Array.from(consolidatedGroups.entries()).map(([groupId, items]) => {
      const totalAmount = items.reduce((sum, item) => 
        sum + calculateLineItemTotal({ price: item.price, quantity: item.quantity }), 0
      );
      
      return {
        name: consolidatedItemLabel || "Consolidated Services",
        quantity: 1,
        price: totalAmount,
        showDetails: false,
        groupId,
      };
    });

    return [...detailedItems, ...consolidatedItems];
  })();

  const shouldShowDetails = (item: LineItem) => {
    if (!includeItemDetails) return false;
    return item.showDetails !== false;
  };

  return (
    <div className="mt-5 font-mono text-pretty">
      <div className="grid grid-cols-[1.5fr_15%_15%_15%] gap-4 items-end relative group mb-2 w-full pb-1 border-b border-border">
        <div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
        {includeItemDetails && (
          <>
            <div className="text-[11px] text-[#878787]">{quantityLabel}</div>
            <div className="text-[11px] text-[#878787]">{priceLabel}</div>
          </>
        )}
        {!includeItemDetails && (
          <>
            <div></div>
            <div></div>
          </>
        )}
        <div className="text-[11px] text-[#878787] text-right">
          {totalLabel}
        </div>
      </div>

      {processedItems.map((item, index) => (
        <div
          key={`line-item-${index.toString()}`}
          className="grid grid-cols-[1.5fr_15%_15%_15%] gap-4 items-start relative group mb-1 w-full py-1"
        >
          <div className="self-start">
            <Description content={item.name} />
          </div>
          
          {shouldShowDetails(item) ? (
            <>
              <div className="text-[11px] self-start">{item.quantity ?? 0}</div>
              <div className="text-[11px] self-start">
                {currency && includeUnits && item.unit
                  ? `${formatAmount({
                      currency,
                      amount: item.price ?? 0,
                      maximumFractionDigits,
                      locale,
                    })}/${item.unit}`
                  : currency &&
                    formatAmount({
                      currency,
                      amount: item.price ?? 0,
                      maximumFractionDigits,
                      locale,
                    })}
              </div>
            </>
          ) : (
            <>
              <div></div>
              <div></div>
            </>
          )}
          
          <div className="text-[11px] text-right self-start">
            {currency &&
              formatAmount({
                maximumFractionDigits,
                currency,
                amount: calculateLineItemTotal({
                  price: item.price,
                  quantity: item.quantity,
                }),
                locale,
              })}
          </div>
        </div>
      ))}
    </div>
  );
}