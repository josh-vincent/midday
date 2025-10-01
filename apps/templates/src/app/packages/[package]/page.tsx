"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Separator } from "@midday/ui/separator";
import { cn } from "@midday/ui/cn";
import { 
  Package,
  Star,
  Download,
  Github,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  Calendar,
  Users,
  AlertTriangle,
  Code2,
  FileText,
  Zap,
  Settings,
  Play,
  Eye,
  Video,
  Image as ImageIcon
} from "lucide-react";
import { packagesAPI, type MockPackage } from "@/lib/mock/packages-mock";
import { useToast } from "@midday/ui/use-toast";

export default function PackageDetailsPage() {
  const params = useParams();
  const packageId = params.package as string;
  const [pkg, setPkg] = useState<MockPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const data = await packagesAPI.getPackage(packageId);
      setPkg(data);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(type);
      toast({
        title: "Copied to clipboard",
        description: `${type} command copied successfully`,
      });
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable": return "bg-green-500";
      case "beta": return "bg-yellow-500";
      case "alpha": return "bg-orange-500";
      case "deprecated": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getDemoIcon = (type: string) => {
    switch (type) {
      case "interactive": return Play;
      case "video": return Video;
      case "image": return ImageIcon;
      default: return ExternalLink;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Package not found</h3>
          <p className="text-muted-foreground mb-4">
            The package you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/packages">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = pkg.icon;

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

      {/* Package Header */}
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <div className={cn(
            "w-20 h-20 rounded-xl flex items-center justify-center text-white",
            pkg.color
          )}>
            <IconComponent className="h-10 w-10" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{pkg.name}</h1>
                <Badge 
                  className={cn("text-white", getStatusColor(pkg.status))}
                  variant="secondary"
                >
                  {pkg.status}
                </Badge>
                <Badge variant="outline">v{pkg.version}</Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                {pkg.description}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {pkg.downloads.toLocaleString()} downloads
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {pkg.stars} stars
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {pkg.contributors} contributors
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {pkg.issues} issues
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Updated {pkg.updatedAt.toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild>
                <a href={pkg.repository} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  View Source
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={pkg.documentation} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Package Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Category</h4>
                <Badge variant="outline">{pkg.category}</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">License</h4>
                <p className="text-sm text-muted-foreground">{pkg.license}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Author</h4>
                <p className="text-sm text-muted-foreground">{pkg.author}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="demos">Live Demos</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Key Features
              </CardTitle>
              <CardDescription>
                Core functionality and capabilities of this package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {pkg.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Installation
              </CardTitle>
              <CardDescription>
                Choose your preferred package manager to install {pkg.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(pkg.installation).map(([manager, command]) => (
                <div key={manager} className="space-y-2">
                  <h4 className="font-medium capitalize">{manager}</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono">
                      {command}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(command, manager)}
                    >
                      {copiedCommand === manager ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          {pkg.examples.map((example, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  {example.title}
                </CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {example.language}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(example.code, `example-${index}`)}
                    >
                      {copiedCommand === `example-${index}` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {pkg.api.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <code className="text-sm font-mono">
                    {endpoint.method} {endpoint.endpoint}
                  </code>
                </CardTitle>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Parameters</h4>
                    <div className="space-y-2">
                      {endpoint.parameters.map((param, paramIndex) => (
                        <div key={paramIndex} className="border rounded-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono">{param.name}</code>
                            <Badge variant="outline" className="text-xs">
                              {param.type}
                            </Badge>
                            {param.required && (
                              <Badge variant="destructive" className="text-xs">
                                required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {endpoint.response && (
                  <div>
                    <h4 className="font-medium mb-2">Response</h4>
                    <code className="block p-3 bg-muted rounded-md text-sm">
                      {endpoint.response}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="demos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pkg.demos.map((demo, index) => {
              const DemoIcon = getDemoIcon(demo.type);
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DemoIcon className="h-5 w-5" />
                      {demo.title}
                    </CardTitle>
                    <CardDescription>{demo.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xs">
                        {demo.type}
                      </Badge>
                      <Link href={demo.url}>
                        <Button className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Demo
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Dependencies
                </CardTitle>
                <CardDescription>
                  Required packages for this module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkg.dependencies.length > 0 ? (
                    pkg.dependencies.map(dep => (
                      <div key={dep} className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm">{dep}</code>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No dependencies</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dev Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dev Dependencies
                </CardTitle>
                <CardDescription>
                  Development and build dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkg.devDependencies.length > 0 ? (
                    pkg.devDependencies.map(dep => (
                      <div key={dep} className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm">{dep}</code>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No dev dependencies</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Peer Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Peer Dependencies
                </CardTitle>
                <CardDescription>
                  Required peer dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkg.peerDependencies.length > 0 ? (
                    pkg.peerDependencies.map(dep => (
                      <div key={dep} className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm">{dep}</code>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No peer dependencies</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}