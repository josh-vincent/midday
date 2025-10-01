import { Text, View } from "@react-pdf/renderer";
import type { LineItem, Template } from "../../../types";
import { calculateLineItemTotal } from "../../../utils/calculate";
import { applyAutoItemizationRules } from "../../../utils/auto-itemization";
import { formatCurrencyForPDF } from "../../../utils/pdf-format";
import { Description } from "./description";

type Props = {
  lineItems: LineItem[];
  currency: string | null;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  locale: string;
  includeDecimals?: boolean;
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
  locale,
  includeDecimals,
  includeUnits,
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
    <View style={{ marginTop: 20 }}>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 0.5,
          borderBottomColor: "#000",
          paddingBottom: 5,
          marginBottom: 5,
        }}
      >
        <Text style={{ flex: 3, fontSize: 9, fontWeight: 500 }}>
          {descriptionLabel}
        </Text>
        {includeItemDetails ? (
          <>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: 500 }}>
              {quantityLabel}
            </Text>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: 500 }}>
              {priceLabel}
            </Text>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            <View style={{ flex: 1 }} />
          </>
        )}
        <Text
          style={{
            flex: 1,
            fontSize: 9,
            fontWeight: 500,
            textAlign: "right",
          }}
        >
          {totalLabel}
        </Text>
      </View>
      
      {processedItems.map((item, index) => (
        <View
          key={`line-item-${index.toString()}`}
          style={{
            flexDirection: "row",
            paddingVertical: 5,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 3 }}>
            <Description content={item.name} />
          </View>

          {shouldShowDetails(item) ? (
            <>
              <Text style={{ flex: 1, fontSize: 9 }}>{item.quantity ?? 0}</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>
                {currency &&
                  formatCurrencyForPDF({
                    amount: item.price ?? 0,
                    currency,
                    locale,
                    maximumFractionDigits,
                  })}
                {includeUnits && item.unit ? ` / ${item.unit}` : null}
              </Text>
            </>
          ) : (
            <>
              <View style={{ flex: 1 }} />
              <View style={{ flex: 1 }} />
            </>
          )}

          <Text style={{ flex: 1, fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: calculateLineItemTotal({
                  price: item.price,
                  quantity: item.quantity,
                }),
                currency,
                locale,
                maximumFractionDigits,
              })}
          </Text>
        </View>
      ))}
    </View>
  );
}