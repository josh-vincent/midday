import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export interface UseTableFiltersOptions {
  defaultValues?: Record<string, any>;
  syncWithUrl?: boolean;
}

export function useTableFilters(options: UseTableFiltersOptions = {}) {
  const { defaultValues = {}, syncWithUrl = true } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL or defaults
  const initialFilters = useMemo(() => {
    if (!syncWithUrl) return defaultValues;

    const filters: Record<string, any> = { ...defaultValues };

    searchParams.forEach((value, key) => {
      // Parse value based on type
      if (value === "true") filters[key] = true;
      else if (value === "false") filters[key] = false;
      else if (!isNaN(Number(value))) filters[key] = Number(value);
      else filters[key] = value;
    });

    return filters;
  }, [searchParams, defaultValues, syncWithUrl]);

  const [filters, setFiltersState] = useState(initialFilters);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const setFilters = useCallback(
    (newFilters: Record<string, any>) => {
      setFiltersState(newFilters);

      if (syncWithUrl) {
        const params = new URLSearchParams();

        Object.entries(newFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== null) {
            if (typeof value === "object") {
              params.set(key, JSON.stringify(value));
            } else {
              params.set(key, String(value));
            }
          }
        });

        if (search) {
          params.set("search", search);
        }

        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
      }
    },
    [pathname, router, search, syncWithUrl],
  );

  const updateFilter = useCallback(
    (key: string, value: any) => {
      setFilters({
        ...filters,
        [key]: value,
      });
    },
    [filters, setFilters],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch("");
  }, [setFilters]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);

      if (syncWithUrl) {
        const params = new URLSearchParams(searchParams);

        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }

        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
      }
    },
    [pathname, router, searchParams, syncWithUrl],
  );

  // Filter data based on current filters and search
  const filterData = useCallback(
    <T extends Record<string, any>>(
      data: T[],
      searchFields: (keyof T)[] = [],
    ): T[] => {
      let filtered = [...data];

      // Apply search filter
      if (search && searchFields.length > 0) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((item) =>
          searchFields.some((field) => {
            const value = item[field];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchLower);
          }),
        );
      }

      // Apply other filters
      Object.entries(filters).forEach(([key, filterValue]) => {
        if (
          filterValue === undefined ||
          filterValue === "" ||
          filterValue === null
        )
          return;

        filtered = filtered.filter((item) => {
          const itemValue = item[key as keyof T];

          // Handle different filter types
          if (typeof filterValue === "object") {
            // Date range filter
            if (filterValue.from && filterValue.to) {
              const itemDate = new Date(itemValue as string);
              return (
                itemDate >= new Date(filterValue.from) &&
                itemDate <= new Date(filterValue.to)
              );
            }
            // Number range filter (array)
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              const num = Number(itemValue);
              return num >= filterValue[0] && num <= filterValue[1];
            }
          }

          // Exact match
          return itemValue === filterValue;
        });
      });

      return filtered;
    },
    [filters, search],
  );

  // Sort data
  const sortData = useCallback(
    <T extends Record<string, any>>(
      data: T[],
      sortKey: keyof T,
      sortDirection: "asc" | "desc" = "asc",
    ): T[] => {
      return [...data].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    },
    [],
  );

  // Paginate data
  const paginateData = useCallback(
    <T>(
      data: T[],
      page: number,
      pageSize: number,
    ): {
      data: T[];
      totalPages: number;
      totalItems: number;
      currentPage: number;
      pageSize: number;
    } => {
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const currentPage = Math.min(Math.max(1, page), totalPages);
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;

      return {
        data: data.slice(start, end),
        totalPages,
        totalItems,
        currentPage,
        pageSize,
      };
    },
    [],
  );

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    search,
    handleSearch,
    filterData,
    sortData,
    paginateData,
  };
}
