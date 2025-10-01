"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Separator } from "@midday/ui/separator";
import { 
  ChevronLeft,
  Filter,
  Search,
  Calendar,
  Check,
  X,
  Users,
  Building,
  Star
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import { packagesAPI, type MockPackage } from "@/lib/mock/packages-mock";

// Mock components to demonstrate the filter components
const SearchField = ({ placeholder, onSearch, className }: { placeholder: string; onSearch: (query: string) => void; className?: string }) => {
  const [query, setQuery] = useState("");
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
};

const DateRangePicker = ({ onRangeChange }: { onRangeChange: (range: string) => void }) => {
  const [selectedRange, setSelectedRange] = useState("");
  
  const presets = [
    { label: "Last 7 days", value: "last-7-days" },
    { label: "Last 30 days", value: "last-30-days" },
    { label: "Last quarter", value: "last-quarter" },
    { label: "Custom range", value: "custom" }
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedRange === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedRange(preset.value);
              onRangeChange(preset.value);
            }}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

const MultiSelectFilter = ({ options, onSelectionChange }: { 
  options: Array<{ label: string; value: string; group?: string }>; 
  onSelectionChange: (selected: string[]) => void 
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  
  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const groupedOptions = options.reduce((acc, option) => {
    const group = option.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, typeof options>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedOptions).map(([group, groupOptions]) => (
        <div key={group} className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">{group}</h4>
          <div className="space-y-1">
            {groupOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start h-8 w-full",
                  selected.includes(option.value) && "bg-accent"
                )}
                onClick={() => handleToggle(option.value)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    selected.includes(option.value) && "bg-primary border-primary"
                  )}>
                    {selected.includes(option.value) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  {option.label}
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function FilterComponentsShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const mockCustomers = [
    { id: 1, name: "Acme Corp", type: "Enterprise", status: "Active", rating: 5 },
    { id: 2, name: "Tech Startup Inc", type: "Startup", status: "Active", rating: 4 },
    { id: 3, name: "Local Business", type: "SMB", status: "Inactive", rating: 3 },
    { id: 4, name: "Global Solutions", type: "Enterprise", status: "Active", rating: 5 },
  ];

  const filterOptions = [
    { label: "Active", value: "active", group: "Status" },
    { label: "Inactive", value: "inactive", group: "Status" },
    { label: "Enterprise", value: "enterprise", group: "Type" },
    { label: "Startup", value: "startup", group: "Type" },
    { label: "SMB", value: "smb", group: "Type" },
    { label: "5 Stars", value: "5-stars", group: "Rating" },
    { label: "4+ Stars", value: "4-stars", group: "Rating" },
  ];

  const filteredCustomers = mockCustomers.filter(customer => {
    // Apply search filter
    if (searchQuery && !customer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply multi-select filters
    if (selectedFilters.length > 0) {
      const customerFilters = [
        customer.status.toLowerCase(),
        customer.type.toLowerCase(),
        customer.rating >= 5 ? "5-stars" : customer.rating >= 4 ? "4-stars" : "low-rating"
      ];
      
      const hasMatchingFilter = selectedFilters.some(filter => 
        customerFilters.includes(filter)
      );
      
      if (!hasMatchingFilter) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div>
        <Link href="/packages">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
            <Filter className="h-10 w-10" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">@midday/filter-components</h1>
                <Badge className="text-white bg-green-500" variant="secondary">
                  stable
                </Badge>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                Advanced filtering components with search fields, date range pickers, and multi-select filters. Perfect for building powerful data filtering interfaces.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild>
                <a href="https://github.com/midday-ai/filter-components" target="_blank" rel="noopener noreferrer">
                  View Source
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://docs.midday.ai/packages/filter-components" target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Interactive Demo */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Interactive Demo</h2>
          <p className="text-muted-foreground">
            Try out the filter components below. The customer list will update in real-time as you apply filters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Field
                </CardTitle>
                <CardDescription>
                  Search with real-time filtering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SearchField
                  placeholder="Search customers..."
                  onSearch={setSearchQuery}
                />
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Searching for: "{searchQuery}"
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date Range Picker
                </CardTitle>
                <CardDescription>
                  Select date ranges with presets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DateRangePicker onRangeChange={setDateRange} />
                {dateRange && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {dateRange.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Multi-Select Filter
                </CardTitle>
                <CardDescription>
                  Filter by multiple criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiSelectFilter
                  options={filterOptions}
                  onSelectionChange={setSelectedFilters}
                />
                {selectedFilters.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Active Filters:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedFilters.map(filter => (
                        <Badge key={filter} variant="secondary" className="text-xs">
                          {filter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Filtered Results</CardTitle>
                <CardDescription>
                  Customer list updates in real-time based on your filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-medium">{customer.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building className="h-3 w-3" />
                              {customer.type}
                              <span>•</span>
                              <Users className="h-3 w-3" />
                              {customer.status}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: customer.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Badge 
                            variant={customer.status === "Active" ? "default" : "secondary"}
                          >
                            {customer.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No customers match your current filters.</p>
                      <p className="text-sm">Try adjusting your search criteria.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredCustomers.length} of {mockCustomers.length} customers
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Installation */}
      <Card>
        <CardHeader>
          <CardTitle>Installation</CardTitle>
          <CardDescription>
            Get started with @midday/filter-components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">npm</h4>
            <code className="block p-3 bg-muted rounded-md text-sm font-mono">
              npm install @midday/filter-components
            </code>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Usage</h4>
            <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
              <code>{`import { SearchField, DateRangePicker, MultiSelectFilter } from "@midday/filter-components";

<SearchField
  placeholder="Search..."
  onSearch={(query) => console.log(query)}
  debounceMs={300}
/>

<DateRangePicker
  presets={['last-7-days', 'last-30-days']}
  onRangeChange={(range) => console.log(range)}
/>

<MultiSelectFilter
  options={[
    { label: 'Active', value: 'active', group: 'Status' }
  ]}
  onSelectionChange={(selected) => console.log(selected)}
/>`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}