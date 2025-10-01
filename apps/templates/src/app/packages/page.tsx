"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { cn } from "@midday/ui/cn";
import { 
  Package,
  Search,
  Star,
  Download,
  ExternalLink,
  TrendingUp,
  Clock,
  Filter,
  Grid,
  List,
  ChevronRight,
  Github,
  BookOpen,
  Code2
} from "lucide-react";
import { packagesAPI, type MockPackage } from "@/lib/mock/packages-mock";

export default function PackagesPage() {
  const [packages, setPackages] = useState<MockPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<MockPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Record<string, number>;
    totalDownloads: number;
    totalStars: number;
  } | null>(null);

  useEffect(() => {
    loadPackages();
    loadStats();
  }, []);

  useEffect(() => {
    filterAndSortPackages();
  }, [packages, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await packagesAPI.getPackages();
      setPackages(data);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const statsData = await packagesAPI.getPackageStats();
    setStats(statsData);
  };

  const filterAndSortPackages = () => {
    let filtered = packages;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query) ||
        pkg.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(pkg => pkg.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(pkg => pkg.status === selectedStatus);
    }

    // Sort packages
    switch (sortBy) {
      case "popularity":
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case "stars":
        filtered.sort((a, b) => b.stars - a.stars);
        break;
      case "updated":
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredPackages(filtered);
  };

  const categories = ["all", "Core", "Infrastructure", "Platform", "Utilities"];
  const statuses = ["all", "stable", "beta", "alpha"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable": return "bg-green-500";
      case "beta": return "bg-yellow-500";
      case "alpha": return "bg-orange-500";
      case "deprecated": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Package Showcase</h1>
          <p className="text-muted-foreground">
            Explore our comprehensive collection of packages for building modern applications
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Packages</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                    <p className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</p>
                  </div>
                  <Download className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stars</p>
                    <p className="text-2xl font-bold">{stats.totalStars.toLocaleString()}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</p>
                  </div>
                  <Filter className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All Status" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="stars">Stars</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground ml-auto">
                {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Core">Core</TabsTrigger>
          <TabsTrigger value="Infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="Platform">Platform</TabsTrigger>
          <TabsTrigger value="Utilities">Utilities</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {viewMode === "grid" ? (
            <PackageGrid packages={filteredPackages} />
          ) : (
            <PackageList packages={filteredPackages} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PackageGridProps {
  packages: MockPackage[];
}

function PackageGrid({ packages }: PackageGridProps) {
  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No packages found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or browse different categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map(pkg => (
        <PackageCard key={pkg.id} package={pkg} />
      ))}
    </div>
  );
}

interface PackageListProps {
  packages: MockPackage[];
}

function PackageList({ packages }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No packages found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or browse different categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {packages.map(pkg => (
        <PackageListItem key={pkg.id} package={pkg} />
      ))}
    </div>
  );
}

interface PackageCardProps {
  package: MockPackage;
}

function PackageCard({ package: pkg }: PackageCardProps) {
  const IconComponent = pkg.icon;

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              pkg.color
            )}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {pkg.name}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                v{pkg.version}
              </CardDescription>
            </div>
          </div>
          <Badge 
            className={cn("text-white", getStatusColor(pkg.status))}
            variant="secondary"
          >
            {pkg.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {pkg.description}
        </p>

        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {pkg.category}
          </Badge>
          <div className="flex flex-wrap gap-1">
            {pkg.keywords.slice(0, 3).map(keyword => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {pkg.keywords.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{pkg.keywords.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {pkg.downloads.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {pkg.stars}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {pkg.updatedAt.toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Link href={`/packages/${pkg.id}`} className="flex-1">
            <Button className="w-full" size="sm">
              View Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <a href={pkg.repository} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={pkg.documentation} target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PackageListItemProps {
  package: MockPackage;
}

function PackageListItem({ package: pkg }: PackageListItemProps) {
  const IconComponent = pkg.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0",
            pkg.color
          )}>
            <IconComponent className="h-6 w-6" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                  {pkg.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {pkg.description}
                </p>
              </div>
              <Badge 
                className={cn("text-white ml-4", getStatusColor(pkg.status))}
                variant="secondary"
              >
                {pkg.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>v{pkg.version}</span>
              <Badge variant="outline" className="text-xs">
                {pkg.category}
              </Badge>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {pkg.downloads.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {pkg.stars}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {pkg.updatedAt.toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {pkg.keywords.slice(0, 4).map(keyword => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {pkg.keywords.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{pkg.keywords.length - 4}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/packages/${pkg.id}`}>
                  <Button size="sm">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="sm" asChild>
                  <a href={pkg.repository} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={pkg.documentation} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "stable": return "bg-green-500";
    case "beta": return "bg-yellow-500";
    case "alpha": return "bg-orange-500";
    case "deprecated": return "bg-red-500";
    default: return "bg-gray-500";
  }
}