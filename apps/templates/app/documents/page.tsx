"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  FolderOpen, 
  File, 
  Star, 
  Users, 
  HardDrive,
  Clock,
  Download,
  Upload,
  Grid3x3,
  List,
  TrendingUp
} from "lucide-react";

// Components
import { DocumentsDataTable } from "@/components/tables/documents/data-table";
import { DocumentsHeader } from "@/components/documents-header";
import { DocumentSheet } from "@/components/sheets/document-sheet";
import { DocumentUploadSheet } from "@/components/sheets/document-upload-sheet";
import { FolderCreateSheet } from "@/components/sheets/folder-create-sheet";
import { FolderTree } from "@/components/documents/folder-tree";
import { DocumentGrid } from "@/components/documents/document-grid";
import { StorageStats } from "@/components/documents/storage-stats";

// Mock data
import { documentsAPI, type MockDocument, type MockFolder } from "@/lib/mock/documents-mock";

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const { toast } = useToast();

  // State
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [folders, setFolders] = useState<MockFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Sheet states
  const [selectedDocument, setSelectedDocument] = useState<MockDocument | null>(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [documentsData, foldersData, statsData] = await Promise.all([
        documentsAPI.getDocuments(),
        documentsAPI.getFolders(),
        documentsAPI.getStorageStats(),
      ]);
      setDocuments(documentsData);
      setFolders(foldersData);
      setStorageStats(statsData);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = 
      document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      document.uploadedBy.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !typeFilter || document.type === typeFilter;
    const matchesFolder = !folderFilter || document.folderId === folderFilter;
    const matchesTags = tagsFilter.length === 0 || tagsFilter.some(tag => document.tags.includes(tag));
    const matchesDate = 
      new Date(document.createdAt) >= dateRange.from && 
      new Date(document.createdAt) <= dateRange.to;
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "recent" && new Date(document.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (activeTab === "shared" && document.shared) ||
      (activeTab === "starred" && document.starred) ||
      (activeTab === "archived" && document.status === "archived");
    
    const matchesSelectedFolder = !selectedFolder || document.folderId === selectedFolder;
    
    return matchesSearch && matchesType && matchesFolder && matchesTags && matchesDate && matchesTab && matchesSelectedFolder;
  });

  // Calculate stats
  const stats = {
    totalDocuments: documents.length,
    totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
    sharedDocuments: documents.filter(doc => doc.shared).length,
    starredDocuments: documents.filter(doc => doc.starred).length,
    recentDocuments: documents.filter(doc => 
      new Date(doc.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    totalFolders: folders.length - 1, // Exclude root
    storageUsed: storageStats?.usedSpace || 0,
    storageTotal: storageStats?.totalSpace || 0,
  };

  // Event handlers
  const handleDocumentClick = (document: MockDocument) => {
    setSelectedDocument(document);
    setShowDocumentDetails(true);
  };

  const handleEditDocument = (document: MockDocument) => {
    setSelectedDocument(document);
    setShowDocumentDetails(true);
  };

  const handleDeleteDocument = async (document: MockDocument) => {
    try {
      await documentsAPI.deleteDocument(document.id);
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully",
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleStarDocument = async (document: MockDocument) => {
    try {
      await documentsAPI.starDocument(document.id, !document.starred);
      toast({
        title: document.starred ? "Removed from starred" : "Added to starred",
        description: `Document ${document.name} has been ${document.starred ? "removed from" : "added to"} starred`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  };

  const handleShareDocument = async (document: MockDocument, userIds: string[]) => {
    try {
      await documentsAPI.shareDocument(document.id, userIds);
      toast({
        title: "Document shared",
        description: `Document ${document.name} has been shared successfully`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share document",
        variant: "destructive",
      });
    }
  };

  const handleMoveDocument = async (document: MockDocument, folderId: string) => {
    try {
      await documentsAPI.moveDocument(document.id, folderId);
      const folder = folders.find(f => f.id === folderId);
      toast({
        title: "Document moved",
        description: `Document moved to ${folder?.name || "folder"}`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (document: MockDocument) => {
    toast({
      title: "Download started",
      description: `Downloading ${document.name}`,
    });
  };

  const handleUploadDocument = async (files: File[], folderId?: string) => {
    try {
      const uploads = files.map(file => documentsAPI.uploadDocument(file, folderId));
      await Promise.all(uploads);
      
      toast({
        title: "Upload completed",
        description: `${files.length} file(s) uploaded successfully`,
      });
      setShowUploadDocument(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    }
  };

  const handleCreateFolder = async (data: any) => {
    try {
      await documentsAPI.createFolder({
        ...data,
        parentId: selectedFolder || "folder_root",
      });
      toast({
        title: "Folder created",
        description: `Folder "${data.name}" has been created successfully`,
      });
      setShowCreateFolder(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
  };

  const handleRefresh = () => {
    loadData();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DocumentsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        folderFilter={folderFilter}
        onFolderFilterChange={setFolderFilter}
        tagsFilter={tagsFilter}
        onTagsFilterChange={setTagsFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUploadDocument={() => setShowUploadDocument(true)}
        onCreateFolder={() => setShowCreateFolder(true)}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalDocuments={documents.length}
        folders={folders}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Documents
              <File className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalDocuments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats.totalSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Folders
              <FolderOpen className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalFolders}
            </div>
            <p className="text-xs text-muted-foreground">
              Organized collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Shared
              <Users className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.sharedDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              With team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Starred
              <Star className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.starredDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              Important documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Storage Used
              <HardDrive className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.storageUsed / stats.storageTotal) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats.storageUsed)} / {formatFileSize(stats.storageTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar - Folder Tree */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Folders</CardTitle>
            </CardHeader>
            <CardContent>
              <FolderTree
                folders={folders}
                selectedFolderId={selectedFolder}
                onFolderSelect={handleFolderSelect}
                onCreateFolder={() => setShowCreateFolder(true)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-6">
              {viewMode === "grid" ? (
                <DocumentGrid
                  documents={filteredDocuments}
                  loading={loading}
                  hasFilters={!!searchQuery || !!typeFilter || !!folderFilter || tagsFilter.length > 0}
                  onDocumentClick={handleDocumentClick}
                  onStarDocument={handleStarDocument}
                  onShareDocument={handleShareDocument}
                  onMoveDocument={handleMoveDocument}
                  onDownloadDocument={handleDownloadDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              ) : (
                <DocumentsDataTable
                  data={filteredDocuments}
                  loading={loading}
                  hasFilters={!!searchQuery || !!typeFilter || !!folderFilter || tagsFilter.length > 0}
                  onDocumentClick={handleDocumentClick}
                  onEditDocument={handleEditDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onStarDocument={handleStarDocument}
                  onShareDocument={handleShareDocument}
                  onMoveDocument={handleMoveDocument}
                  onDownloadDocument={handleDownloadDocument}
                />
              )}

              {activeTab === "all" && storageStats && (
                <StorageStats stats={storageStats} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sheet Components */}
      <DocumentSheet
        document={selectedDocument}
        open={showDocumentDetails}
        onOpenChange={setShowDocumentDetails}
        onEdit={handleEditDocument}
        onDelete={handleDeleteDocument}
        onStar={handleStarDocument}
        onShare={handleShareDocument}
        onMove={handleMoveDocument}
        onDownload={handleDownloadDocument}
        folders={folders}
      />

      <DocumentUploadSheet
        open={showUploadDocument}
        onOpenChange={setShowUploadDocument}
        onUpload={handleUploadDocument}
        folders={folders}
        selectedFolderId={selectedFolder}
      />

      <FolderCreateSheet
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onCreate={handleCreateFolder}
        parentFolder={folders.find(f => f.id === selectedFolder)}
      />
    </div>
  );
}