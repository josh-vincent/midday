export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MockFolder {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  color?: string;
  icon?: string;
  documentCount: number;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockDocument {
  id: string;
  name: string;
  description?: string;
  type: "pdf" | "doc" | "docx" | "xlsx" | "xls" | "ppt" | "pptx" | "txt" | "image" | "video" | "audio" | "zip" | "other";
  size: number;
  mimeType: string;
  url: string;
  folderId: string | null;
  folderName?: string;
  tags: string[];
  version: number;
  uploadedBy: MockUser;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  shared: boolean;
  sharedWith: MockUser[];
  permissions: "read" | "write" | "admin";
  metadata: Record<string, any>;
  starred: boolean;
  status: "active" | "archived" | "deleted";
  thumbnail?: string;
  fileExtension: string;
}

const users: MockUser[] = [
  {
    id: "user_1",
    name: "John Doe",
    email: "john@company.com",
    avatar: "https://avatar.vercel.sh/john",
  },
  {
    id: "user_2",
    name: "Jane Smith",
    email: "jane@company.com",
    avatar: "https://avatar.vercel.sh/jane",
  },
  {
    id: "user_3",
    name: "Mike Johnson",
    email: "mike@company.com",
    avatar: "https://avatar.vercel.sh/mike",
  },
  {
    id: "user_4",
    name: "Sarah Wilson",
    email: "sarah@company.com",
    avatar: "https://avatar.vercel.sh/sarah",
  },
  {
    id: "user_5",
    name: "David Brown",
    email: "david@company.com",
    avatar: "https://avatar.vercel.sh/david",
  },
];

const folders: MockFolder[] = [
  {
    id: "folder_root",
    name: "Root",
    parentId: null,
    path: "/",
    documentCount: 0,
    size: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "folder_1",
    name: "Contracts",
    parentId: "folder_root",
    path: "/Contracts",
    color: "#3b82f6",
    icon: "FileText",
    documentCount: 8,
    size: 15728640, // ~15MB
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-10T14:30:00Z",
  },
  {
    id: "folder_2",
    name: "Financial Reports",
    parentId: "folder_root",
    path: "/Financial Reports",
    color: "#10b981",
    icon: "BarChart3",
    documentCount: 12,
    size: 25165824, // ~24MB
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-03-15T16:45:00Z",
  },
  {
    id: "folder_3",
    name: "Marketing Materials",
    parentId: "folder_root",
    path: "/Marketing Materials",
    color: "#f59e0b",
    icon: "Megaphone",
    documentCount: 25,
    size: 52428800, // ~50MB
    createdAt: "2024-02-01T11:30:00Z",
    updatedAt: "2024-03-20T09:20:00Z",
  },
  {
    id: "folder_4",
    name: "HR Documents",
    parentId: "folder_root",
    path: "/HR Documents",
    color: "#8b5cf6",
    icon: "Users",
    documentCount: 18,
    size: 31457280, // ~30MB
    createdAt: "2024-02-05T08:45:00Z",
    updatedAt: "2024-03-18T13:15:00Z",
  },
  {
    id: "folder_5",
    name: "Legal",
    parentId: "folder_root",
    path: "/Legal",
    color: "#ef4444",
    icon: "Scale",
    documentCount: 6,
    size: 18874368, // ~18MB
    createdAt: "2024-02-10T14:20:00Z",
    updatedAt: "2024-03-12T10:55:00Z",
  },
  {
    id: "folder_6",
    name: "Q1 2024",
    parentId: "folder_2",
    path: "/Financial Reports/Q1 2024",
    color: "#10b981",
    icon: "Calendar",
    documentCount: 4,
    size: 8388608, // ~8MB
    createdAt: "2024-01-25T16:00:00Z",
    updatedAt: "2024-03-25T12:30:00Z",
  },
  {
    id: "folder_7",
    name: "Campaigns 2024",
    parentId: "folder_3",
    path: "/Marketing Materials/Campaigns 2024",
    color: "#f59e0b",
    icon: "Target",
    documentCount: 15,
    size: 31457280, // ~30MB
    createdAt: "2024-02-15T10:30:00Z",
    updatedAt: "2024-03-22T15:40:00Z",
  },
];

const documentNames = [
  "Service Agreement Template",
  "Annual Budget Report 2024",
  "Marketing Campaign Brief",
  "Employee Handbook",
  "Privacy Policy",
  "Terms of Service",
  "Q1 Financial Statement",
  "Brand Guidelines",
  "Performance Review Template",
  "Project Proposal",
  "Invoice Template",
  "Client Presentation",
  "User Research Report",
  "Technical Specification",
  "Meeting Minutes",
  "Product Roadmap",
  "Sales Report",
  "Training Materials",
  "Compliance Checklist",
  "Data Backup Plan",
  "Security Policy",
  "Onboarding Guide",
  "API Documentation",
  "Design System",
  "Business Plan",
  "Risk Assessment",
  "Market Analysis",
  "Customer Feedback",
  "Product Requirements",
  "Architecture Diagram",
];

const tags = [
  "important",
  "draft",
  "final",
  "confidential",
  "urgent",
  "review",
  "approved",
  "archived",
  "template",
  "legal",
  "financial",
  "marketing",
  "hr",
  "technical",
  "public",
  "internal",
  "client",
  "project",
  "policy",
  "guidelines",
];

const fileTypes = [
  { type: "pdf", mimeType: "application/pdf", extensions: [".pdf"] },
  { type: "doc", mimeType: "application/msword", extensions: [".doc"] },
  { type: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extensions: [".docx"] },
  { type: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extensions: [".xlsx"] },
  { type: "xls", mimeType: "application/vnd.ms-excel", extensions: [".xls"] },
  { type: "ppt", mimeType: "application/vnd.ms-powerpoint", extensions: [".ppt"] },
  { type: "pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extensions: [".pptx"] },
  { type: "txt", mimeType: "text/plain", extensions: [".txt"] },
  { type: "image", mimeType: "image/jpeg", extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"] },
  { type: "video", mimeType: "video/mp4", extensions: [".mp4", ".mov", ".avi", ".mkv"] },
  { type: "audio", mimeType: "audio/mpeg", extensions: [".mp3", ".wav", ".m4a"] },
  { type: "zip", mimeType: "application/zip", extensions: [".zip", ".rar", ".7z"] },
];

function getRandomTags(count = 3): string[] {
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * count) + 1);
}

function getRandomUsers(count = 3): MockUser[] {
  const shuffled = [...users].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * count));
}

function generateFileSize(): number {
  const sizeRanges = [
    { min: 1024, max: 1024 * 100 }, // 1KB - 100KB (documents)
    { min: 1024 * 100, max: 1024 * 1024 * 5 }, // 100KB - 5MB (larger documents)
    { min: 1024 * 1024 * 5, max: 1024 * 1024 * 50 }, // 5MB - 50MB (media files)
  ];
  
  const range = sizeRanges[Math.floor(Math.random() * sizeRanges.length)];
  return Math.floor(Math.random() * (range.max - range.min) + range.min);
}

function generateDocuments(count: number): MockDocument[] {
  const documents: MockDocument[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const fileTypeConfig = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    const extension = fileTypeConfig.extensions[Math.floor(Math.random() * fileTypeConfig.extensions.length)];
    const baseName = documentNames[Math.floor(Math.random() * documentNames.length)];
    const fileName = `${baseName}${extension}`;
    
    const folder = folders[Math.floor(Math.random() * (folders.length - 1)) + 1]; // Exclude root
    const uploadedBy = users[Math.floor(Math.random() * users.length)];
    const size = generateFileSize();
    
    // Generate dates
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * daysAgo * 0.5) * 24 * 60 * 60 * 1000);
    const lastAccessedAt = Math.random() > 0.3 
      ? new Date(updatedAt.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    const document: MockDocument = {
      id: `doc_${i + 1}`,
      name: fileName,
      description: Math.random() > 0.5 ? `Description for ${baseName}` : undefined,
      type: fileTypeConfig.type as MockDocument["type"],
      size,
      mimeType: fileTypeConfig.mimeType,
      url: `/files/${folder.id}/${fileName}`,
      folderId: folder.id,
      folderName: folder.name,
      tags: getRandomTags(),
      version: Math.floor(Math.random() * 5) + 1,
      uploadedBy,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      lastAccessedAt,
      shared: Math.random() > 0.6,
      sharedWith: Math.random() > 0.6 ? getRandomUsers() : [],
      permissions: ["read", "write", "admin"][Math.floor(Math.random() * 3)] as MockDocument["permissions"],
      metadata: {
        author: uploadedBy.name,
        category: folder.name,
        project: Math.random() > 0.5 ? "Project Alpha" : "Project Beta",
        department: Math.random() > 0.5 ? "Engineering" : "Marketing",
      },
      starred: Math.random() > 0.8,
      status: Math.random() > 0.95 ? "archived" : "active",
      thumbnail: fileTypeConfig.type === "image" ? `/thumbnails/doc_${i + 1}.jpg` : undefined,
      fileExtension: extension,
    };
    
    documents.push(document);
  }
  
  return documents.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// Update folder document counts and sizes
function updateFolderStats(documents: MockDocument[]): MockFolder[] {
  const updatedFolders = [...folders];
  
  updatedFolders.forEach(folder => {
    const folderDocs = documents.filter(doc => doc.folderId === folder.id);
    folder.documentCount = folderDocs.length;
    folder.size = folderDocs.reduce((total, doc) => total + doc.size, 0);
  });
  
  return updatedFolders;
}

// Mock API
export const documentsAPI = {
  getDocuments: async (): Promise<MockDocument[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateDocuments(75);
  },

  getDocument: async (id: string): Promise<MockDocument | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const documents = generateDocuments(75);
    return documents.find(d => d.id === id) || null;
  },

  getFolders: async (): Promise<MockFolder[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const documents = generateDocuments(75);
    return updateFolderStats(documents);
  },

  getFolder: async (id: string): Promise<MockFolder | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const documents = generateDocuments(75);
    const updatedFolders = updateFolderStats(documents);
    return updatedFolders.find(f => f.id === id) || null;
  },

  createDocument: async (data: Partial<MockDocument>): Promise<MockDocument> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const uploadedBy = users[0]; // Default user
    const now = new Date().toISOString();
    
    return {
      id: `doc_${Date.now()}`,
      name: data.name || "New Document",
      description: data.description,
      type: data.type || "pdf",
      size: data.size || 1024,
      mimeType: data.mimeType || "application/pdf",
      url: data.url || `/files/${data.folderId}/${data.name}`,
      folderId: data.folderId || "folder_root",
      folderName: data.folderName,
      tags: data.tags || [],
      version: 1,
      uploadedBy,
      createdAt: now,
      updatedAt: now,
      shared: false,
      sharedWith: [],
      permissions: "write",
      metadata: data.metadata || {},
      starred: false,
      status: "active",
      fileExtension: data.fileExtension || ".pdf",
      ...data,
    } as MockDocument;
  },

  updateDocument: async (id: string, data: Partial<MockDocument>): Promise<MockDocument> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const documents = generateDocuments(75);
    const document = documents.find(d => d.id === id);
    if (!document) throw new Error("Document not found");
    
    return {
      ...document,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  deleteDocument: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  moveDocument: async (id: string, folderId: string): Promise<MockDocument> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const documents = generateDocuments(75);
    const document = documents.find(d => d.id === id);
    if (!document) throw new Error("Document not found");
    
    const folder = folders.find(f => f.id === folderId);
    
    return {
      ...document,
      folderId,
      folderName: folder?.name,
      updatedAt: new Date().toISOString(),
    };
  },

  shareDocument: async (id: string, userIds: string[]): Promise<MockDocument> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const documents = generateDocuments(75);
    const document = documents.find(d => d.id === id);
    if (!document) throw new Error("Document not found");
    
    const sharedWith = users.filter(u => userIds.includes(u.id));
    
    return {
      ...document,
      shared: sharedWith.length > 0,
      sharedWith,
      updatedAt: new Date().toISOString(),
    };
  },

  starDocument: async (id: string, starred: boolean): Promise<MockDocument> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const documents = generateDocuments(75);
    const document = documents.find(d => d.id === id);
    if (!document) throw new Error("Document not found");
    
    return {
      ...document,
      starred,
      updatedAt: new Date().toISOString(),
    };
  },

  createFolder: async (data: Partial<MockFolder>): Promise<MockFolder> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const now = new Date().toISOString();
    
    return {
      id: `folder_${Date.now()}`,
      name: data.name || "New Folder",
      parentId: data.parentId || "folder_root",
      path: data.path || `/${data.name}`,
      color: data.color,
      icon: data.icon,
      documentCount: 0,
      size: 0,
      createdAt: now,
      updatedAt: now,
      ...data,
    } as MockFolder;
  },

  updateFolder: async (id: string, data: Partial<MockFolder>): Promise<MockFolder> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const documents = generateDocuments(75);
    const updatedFolders = updateFolderStats(documents);
    const folder = updatedFolders.find(f => f.id === id);
    if (!folder) throw new Error("Folder not found");
    
    return {
      ...folder,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  deleteFolder: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getUsers: async (): Promise<MockUser[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return users;
  },

  uploadDocument: async (file: File, folderId?: string): Promise<MockDocument> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
    
    const fileType = fileTypes.find(ft => 
      ft.extensions.some(ext => file.name.toLowerCase().endsWith(ext))
    ) || fileTypes.find(ft => ft.type === "other")!;
    
    return {
      id: `doc_${Date.now()}`,
      name: file.name,
      type: fileType.type as MockDocument["type"],
      size: file.size,
      mimeType: file.type || fileType.mimeType,
      url: `/files/${folderId || "folder_root"}/${file.name}`,
      folderId: folderId || "folder_root",
      folderName: folders.find(f => f.id === folderId)?.name,
      tags: [],
      version: 1,
      uploadedBy: users[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shared: false,
      sharedWith: [],
      permissions: "write",
      metadata: {},
      starred: false,
      status: "active",
      fileExtension: file.name.substring(file.name.lastIndexOf('.')),
    };
  },

  searchDocuments: async (query: string): Promise<MockDocument[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const documents = generateDocuments(75);
    
    const searchTerm = query.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm) ||
      doc.description?.toLowerCase().includes(searchTerm) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      doc.uploadedBy.name.toLowerCase().includes(searchTerm) ||
      doc.folderName?.toLowerCase().includes(searchTerm)
    );
  },

  getStorageStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const documents = generateDocuments(75);
    const totalSize = documents.reduce((total, doc) => total + doc.size, 0);
    
    return {
      totalSize,
      usedSpace: totalSize,
      totalSpace: 1024 * 1024 * 1024 * 100, // 100GB
      documentCount: documents.length,
      folderCount: folders.length - 1, // Exclude root
      recentUploads: documents.slice(0, 5),
      popularDocuments: documents
        .filter(doc => doc.lastAccessedAt)
        .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime())
        .slice(0, 5),
      typeDistribution: fileTypes.map(ft => ({
        type: ft.type,
        count: documents.filter(doc => doc.type === ft.type).length,
        size: documents.filter(doc => doc.type === ft.type).reduce((total, doc) => total + doc.size, 0),
      })),
    };
  },
};