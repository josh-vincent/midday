import { getColorFromName } from "@/utils/categories";
import {
  formatISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

// Function to calculate periods - called on demand to prevent hydration mismatches
export function getSpendingPeriodOptions() {
  const now = new Date();

  return [
    {
      id: "last_30d",
      from: formatISO(subDays(now, 30), { representation: "date" }),
      to: formatISO(now, { representation: "date" }),
    },
    {
      id: "this_month",
      from: formatISO(startOfMonth(now), { representation: "date" }),
      to: formatISO(now, { representation: "date" }),
    },
    {
      id: "last_month",
      from: formatISO(subMonths(startOfMonth(now), 1), {
        representation: "date",
      }),
      to: formatISO(now, { representation: "date" }),
    },
    {
      id: "this_year",
      from: formatISO(startOfYear(now), { representation: "date" }),
      to: formatISO(now, { representation: "date" }),
    },
    {
      id: "last_year",
      from: formatISO(subYears(startOfMonth(now), 1), {
        representation: "date",
      }),
      to: formatISO(now, { representation: "date" }),
    },
  ];
}

// Export a getter for default period
export function getDefaultPeriod() {
  return getSpendingPeriodOptions()[0];
}

// Legacy exports for backward compatibility - calculate on access
export const defaultPeriod = {
  id: "last_30d",
  get from() {
    return formatISO(subDays(new Date(), 30), { representation: "date" });
  },
  get to() {
    return formatISO(new Date(), { representation: "date" });
  },
};

export const options = getSpendingPeriodOptions();

export const spendingExampleData = [
  {
    slug: "equipment",
    color: getColorFromName("Equipment") || "#F78DA7",
    name: "Equipment",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "tools",
    color: getColorFromName("Tools") || "#F78DA7",
    name: "Tools",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "software",
    color: getColorFromName("Software") || "#EB144C",
    name: "Software",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "office-supplies",
    color: getColorFromName("Office Supplies") || "#9900EF",
    name: "Office Supplies",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "vehicle",
    color: getColorFromName("Vehicle") || "#00D084",
    name: "Vehicle",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "rent",
    color: getColorFromName("Rent") || "#FF6900",
    name: "Rent",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "meals",
    color: getColorFromName("Meals") || "#FCB900",
    name: "Meals",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "travel",
    color: getColorFromName("Travel") || "#FF5A5F",
    name: "Travel",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "other",
    color: getColorFromName("Other") || "#00D084",
    name: "Other",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
];
export const spendingExampleDataOld = [
  {
    slug: "rent",
    color: getColorFromName("Rent") || "#FF6900",
    name: "Rent",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "meals",
    color: getColorFromName("Meals") || "#FCB900",
    name: "Meals",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "other",
    color: getColorFromName("Other") || "#00D084",
    name: "Other",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "internet-and-telephone",
    color: getColorFromName("Internet and Telephone") || "#8ED1FC",
    name: "Internet and Telephone",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "facilities-expenses",
    color: getColorFromName("Facilities Expenses") || "#0693E3",
    name: "Facilities Expenses",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "transfer",
    color: getColorFromName("Transfer") || "#ABB8C3",
    name: "Transfer",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "software",
    color: getColorFromName("Software") || "#EB144C",
    name: "Software",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "equipment",
    color: getColorFromName("Equipment") || "#F78DA7",
    name: "Equipment",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "office-supplies",
    color: getColorFromName("Office Supplies") || "#9900EF",
    name: "Office Supplies",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "uncategorized",
    color: getColorFromName("Uncategorized") || "#0079BF",
    name: "Uncategorized",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "fees",
    color: getColorFromName("Fees") || "#B6BBBF",
    name: "Fees",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "travel",
    color: getColorFromName("Travel") || "#FF5A5F",
    name: "Travel",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
];
