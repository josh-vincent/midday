import { 
  Package, 
  Database, 
  Mail, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Clock, 
  Zap, 
  Settings, 
  Shield, 
  Webhook, 
  Search,
  Bot,
  CreditCard,
  MessageSquare,
  Image,
  Code,
  Table2,
  Filter,
  Layers,
  Edit,
  FormInput
} from "lucide-react";

export interface MockPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'Core' | 'Infrastructure' | 'Platform' | 'Utilities';
  features: string[];
  icon: any;
  color: string;
  status: 'stable' | 'beta' | 'alpha' | 'deprecated';
  installation: {
    npm?: string;
    yarn?: string;
    pnpm?: string;
    bun?: string;
  };
  documentation: string;
  repository: string;
  license: string;
  author: string;
  keywords: string[];
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
  examples: {
    title: string;
    description: string;
    code: string;
    language: string;
  }[];
  api: {
    endpoint: string;
    method: string;
    description: string;
    parameters?: { name: string; type: string; required: boolean; description: string }[];
    response?: string;
  }[];
  demos: {
    title: string;
    description: string;
    url: string;
    type: 'interactive' | 'video' | 'image';
  }[];
  createdAt: Date;
  updatedAt: Date;
  downloads: number;
  stars: number;
  issues: number;
  contributors: number;
}

const mockPackages: MockPackage[] = [
  {
    id: 'customers',
    name: 'Customer Management',
    description: 'Comprehensive customer relationship management system with advanced features for customer lifecycle management.',
    version: '2.1.4',
    category: 'Core',
    features: [
      'Customer CRUD operations',
      'Customer segmentation',
      'Contact management',
      'Customer analytics',
      'Import/Export functionality',
      'Custom fields support',
      'Customer history tracking',
      'Communication logs'
    ],
    icon: Users,
    color: 'bg-blue-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/customers',
      yarn: 'yarn add @midday/customers',
      pnpm: 'pnpm add @midday/customers',
      bun: 'bun add @midday/customers'
    },
    documentation: 'https://docs.midday.ai/packages/customers',
    repository: 'https://github.com/midday-ai/customers',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['customers', 'crm', 'management', 'contacts'],
    dependencies: ['@midday/ui', '@midday/utils', 'react', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Basic Customer Creation',
        description: 'Create a new customer with basic information',
        language: 'typescript',
        code: `import { customersAPI } from '@midday/customers';

const newCustomer = await customersAPI.createCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Example Corp',
  type: 'business',
  status: 'active'
});`
      },
      {
        title: 'Customer Search & Filtering',
        description: 'Search and filter customers with advanced criteria',
        language: 'typescript',
        code: `import { customersAPI } from '@midday/customers';

const customers = await customersAPI.getCustomers({
  search: 'john',
  status: 'active',
  type: 'business',
  tags: ['vip'],
  limit: 20,
  offset: 0
});`
      }
    ],
    api: [
      {
        endpoint: '/api/customers',
        method: 'GET',
        description: 'Retrieve a list of customers',
        parameters: [
          { name: 'search', type: 'string', required: false, description: 'Search query' },
          { name: 'status', type: 'string', required: false, description: 'Customer status filter' },
          { name: 'limit', type: 'number', required: false, description: 'Number of results to return' }
        ],
        response: '{ customers: Customer[], total: number, hasMore: boolean }'
      },
      {
        endpoint: '/api/customers',
        method: 'POST',
        description: 'Create a new customer',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Customer name' },
          { name: 'email', type: 'string', required: true, description: 'Customer email' },
          { name: 'phone', type: 'string', required: false, description: 'Customer phone' }
        ],
        response: '{ customer: Customer }'
      }
    ],
    demos: [
      {
        title: 'Customer Dashboard',
        description: 'Interactive customer management dashboard',
        url: '/customers',
        type: 'interactive'
      },
      {
        title: 'Customer Analytics',
        description: 'Customer analytics and reporting features',
        url: '/customers/analytics',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-20'),
    downloads: 15420,
    stars: 234,
    issues: 12,
    contributors: 8
  },
  {
    id: 'invoices',
    name: 'Invoice Management',
    description: 'Complete invoicing solution with automated billing, payment tracking, and professional invoice generation.',
    version: '1.8.2',
    category: 'Core',
    features: [
      'Invoice creation and editing',
      'Automated billing cycles',
      'Payment tracking',
      'Multiple payment methods',
      'Invoice templates',
      'Tax calculations',
      'Multi-currency support',
      'PDF generation'
    ],
    icon: FileText,
    color: 'bg-green-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/invoices',
      yarn: 'yarn add @midday/invoices',
      pnpm: 'pnpm add @midday/invoices',
      bun: 'bun add @midday/invoices'
    },
    documentation: 'https://docs.midday.ai/packages/invoices',
    repository: 'https://github.com/midday-ai/invoices',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['invoices', 'billing', 'payments', 'accounting'],
    dependencies: ['@midday/ui', '@midday/customers', 'jspdf', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Create Invoice',
        description: 'Create a new invoice with line items',
        language: 'typescript',
        code: `import { invoicesAPI } from '@midday/invoices';

const invoice = await invoicesAPI.createInvoice({
  customerId: 'customer-123',
  items: [
    {
      description: 'Web Development',
      quantity: 40,
      rate: 75,
      amount: 3000
    }
  ],
  tax: 0.08,
  dueDate: new Date('2024-10-15')
});`
      }
    ],
    api: [
      {
        endpoint: '/api/invoices',
        method: 'POST',
        description: 'Create a new invoice',
        parameters: [
          { name: 'customerId', type: 'string', required: true, description: 'Customer ID' },
          { name: 'items', type: 'array', required: true, description: 'Invoice line items' }
        ]
      }
    ],
    demos: [
      {
        title: 'Invoice Builder',
        description: 'Interactive invoice creation tool',
        url: '/invoices/create',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-09-18'),
    downloads: 12850,
    stars: 189,
    issues: 8,
    contributors: 6
  },
  {
    id: 'transactions',
    name: 'Transaction Processing',
    description: 'Secure transaction processing system with support for multiple payment gateways and fraud detection.',
    version: '3.2.1',
    category: 'Core',
    features: [
      'Multi-gateway support',
      'Fraud detection',
      'Transaction monitoring',
      'Refund processing',
      'Recurring payments',
      'Webhook notifications',
      'PCI compliance',
      'Real-time analytics'
    ],
    icon: CreditCard,
    color: 'bg-purple-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/transactions',
      yarn: 'yarn add @midday/transactions',
      pnpm: 'pnpm add @midday/transactions',
      bun: 'bun add @midday/transactions'
    },
    documentation: 'https://docs.midday.ai/packages/transactions',
    repository: 'https://github.com/midday-ai/transactions',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['transactions', 'payments', 'gateway', 'security'],
    dependencies: ['@midday/ui', '@midday/security', 'stripe', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Process Payment',
        description: 'Process a payment transaction',
        language: 'typescript',
        code: `import { transactionsAPI } from '@midday/transactions';

const transaction = await transactionsAPI.processPayment({
  amount: 2500,
  currency: 'USD',
  paymentMethod: 'card',
  customerId: 'customer-123',
  description: 'Service payment'
});`
      }
    ],
    api: [
      {
        endpoint: '/api/transactions',
        method: 'POST',
        description: 'Process a new transaction',
        parameters: [
          { name: 'amount', type: 'number', required: true, description: 'Transaction amount in cents' },
          { name: 'currency', type: 'string', required: true, description: 'Currency code' }
        ]
      }
    ],
    demos: [
      {
        title: 'Payment Dashboard',
        description: 'Transaction monitoring and analytics',
        url: '/transactions',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-09-22'),
    downloads: 18200,
    stars: 312,
    issues: 15,
    contributors: 12
  },
  {
    id: 'database',
    name: 'Database Management',
    description: 'Advanced database management toolkit with query builder, migrations, and performance monitoring.',
    version: '4.1.0',
    category: 'Infrastructure',
    features: [
      'Query builder',
      'Schema migrations',
      'Performance monitoring',
      'Connection pooling',
      'Multi-database support',
      'Backup utilities',
      'Security auditing',
      'Real-time metrics'
    ],
    icon: Database,
    color: 'bg-orange-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/database',
      yarn: 'yarn add @midday/database',
      pnpm: 'pnpm add @midday/database',
      bun: 'bun add @midday/database'
    },
    documentation: 'https://docs.midday.ai/packages/database',
    repository: 'https://github.com/midday-ai/database',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['database', 'orm', 'migrations', 'performance'],
    dependencies: ['@midday/utils', 'pg', 'mysql2', 'sqlite3'],
    devDependencies: ['@types/pg', 'jest', 'eslint'],
    peerDependencies: [],
    examples: [
      {
        title: 'Query Builder',
        description: 'Build complex database queries',
        language: 'typescript',
        code: `import { db } from '@midday/database';

const users = await db
  .select(['id', 'name', 'email'])
  .from('users')
  .where('status', 'active')
  .orderBy('created_at', 'desc')
  .limit(10);`
      }
    ],
    api: [
      {
        endpoint: '/api/database/query',
        method: 'POST',
        description: 'Execute database query',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'SQL query to execute' }
        ]
      }
    ],
    demos: [
      {
        title: 'Database Explorer',
        description: 'Interactive database management interface',
        url: '/database',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-09-25'),
    downloads: 8950,
    stars: 156,
    issues: 6,
    contributors: 10
  },
  {
    id: 'email',
    name: 'Email Service',
    description: 'Comprehensive email service with template management, automated campaigns, and delivery tracking.',
    version: '2.3.1',
    category: 'Platform',
    features: [
      'Template management',
      'Automated campaigns',
      'Delivery tracking',
      'A/B testing',
      'Personalization',
      'Bounce handling',
      'Analytics dashboard',
      'SMTP configuration'
    ],
    icon: Mail,
    color: 'bg-red-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/email',
      yarn: 'yarn add @midday/email',
      pnpm: 'pnpm add @midday/email',
      bun: 'bun add @midday/email'
    },
    documentation: 'https://docs.midday.ai/packages/email',
    repository: 'https://github.com/midday-ai/email',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['email', 'campaigns', 'templates', 'delivery'],
    dependencies: ['@midday/ui', 'nodemailer', 'handlebars', 'typescript'],
    devDependencies: ['@types/nodemailer', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Send Email',
        description: 'Send a templated email',
        language: 'typescript',
        code: `import { emailAPI } from '@midday/email';

await emailAPI.sendEmail({
  to: 'user@example.com',
  template: 'welcome',
  data: {
    name: 'John Doe',
    verificationUrl: 'https://app.com/verify'
  }
});`
      }
    ],
    api: [
      {
        endpoint: '/api/email/send',
        method: 'POST',
        description: 'Send an email',
        parameters: [
          { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
          { name: 'template', type: 'string', required: true, description: 'Email template name' }
        ]
      }
    ],
    demos: [
      {
        title: 'Email Campaign Builder',
        description: 'Create and manage email campaigns',
        url: '/email/campaigns',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-09-15'),
    downloads: 11300,
    stars: 201,
    issues: 9,
    contributors: 7
  },
  {
    id: 'calendar',
    name: 'Calendar & Scheduling',
    description: 'Advanced calendar system with scheduling, recurring events, and integration capabilities.',
    version: '1.5.3',
    category: 'Platform',
    features: [
      'Event management',
      'Recurring events',
      'Time zone support',
      'Calendar sharing',
      'Booking system',
      'Availability management',
      'Reminder notifications',
      'External integrations'
    ],
    icon: Calendar,
    color: 'bg-blue-600',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/calendar',
      yarn: 'yarn add @midday/calendar',
      pnpm: 'pnpm add @midday/calendar',
      bun: 'bun add @midday/calendar'
    },
    documentation: 'https://docs.midday.ai/packages/calendar',
    repository: 'https://github.com/midday-ai/calendar',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['calendar', 'scheduling', 'events', 'booking'],
    dependencies: ['@midday/ui', 'date-fns', 'rrule', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Create Event',
        description: 'Create a calendar event',
        language: 'typescript',
        code: `import { calendarAPI } from '@midday/calendar';

const event = await calendarAPI.createEvent({
  title: 'Team Meeting',
  startDate: new Date('2024-10-15T10:00:00Z'),
  endDate: new Date('2024-10-15T11:00:00Z'),
  attendees: ['john@example.com', 'jane@example.com'],
  recurring: {
    frequency: 'weekly',
    interval: 1
  }
});`
      }
    ],
    api: [
      {
        endpoint: '/api/calendar/events',
        method: 'POST',
        description: 'Create a calendar event',
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'Event title' },
          { name: 'startDate', type: 'string', required: true, description: 'Event start date/time' }
        ]
      }
    ],
    demos: [
      {
        title: 'Calendar Interface',
        description: 'Interactive calendar with event management',
        url: '/calendar',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-09-12'),
    downloads: 9200,
    stars: 167,
    issues: 11,
    contributors: 9
  },
  {
    id: 'reports',
    name: 'Analytics & Reporting',
    description: 'Powerful analytics and reporting engine with customizable dashboards and data visualization.',
    version: '2.0.5',
    category: 'Platform',
    features: [
      'Custom dashboards',
      'Data visualization',
      'Report scheduling',
      'Export capabilities',
      'Real-time metrics',
      'Custom queries',
      'Chart libraries',
      'Performance tracking'
    ],
    icon: BarChart3,
    color: 'bg-indigo-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/reports',
      yarn: 'yarn add @midday/reports',
      pnpm: 'pnpm add @midday/reports',
      bun: 'bun add @midday/reports'
    },
    documentation: 'https://docs.midday.ai/packages/reports',
    repository: 'https://github.com/midday-ai/reports',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['analytics', 'reports', 'dashboards', 'charts'],
    dependencies: ['@midday/ui', 'recharts', 'd3', 'typescript'],
    devDependencies: ['@types/d3', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Create Report',
        description: 'Generate a custom report',
        language: 'typescript',
        code: `import { reportsAPI } from '@midday/reports';

const report = await reportsAPI.generateReport({
  type: 'revenue',
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  },
  groupBy: 'month',
  filters: {
    status: 'completed'
  }
});`
      }
    ],
    api: [
      {
        endpoint: '/api/reports/generate',
        method: 'POST',
        description: 'Generate a report',
        parameters: [
          { name: 'type', type: 'string', required: true, description: 'Report type' },
          { name: 'dateRange', type: 'object', required: true, description: 'Date range for report' }
        ]
      }
    ],
    demos: [
      {
        title: 'Analytics Dashboard',
        description: 'Interactive analytics and reporting dashboard',
        url: '/reports',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-09-18'),
    downloads: 13400,
    stars: 245,
    issues: 7,
    contributors: 11
  },
  {
    id: 'time-tracking',
    name: 'Time Tracking',
    description: 'Comprehensive time tracking solution with project management and productivity analytics.',
    version: '1.3.2',
    category: 'Utilities',
    features: [
      'Time entry tracking',
      'Project management',
      'Team collaboration',
      'Productivity analytics',
      'Invoice integration',
      'Timer functionality',
      'Reporting tools',
      'Mobile support'
    ],
    icon: Clock,
    color: 'bg-teal-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/time-tracking',
      yarn: 'yarn add @midday/time-tracking',
      pnpm: 'pnpm add @midday/time-tracking',
      bun: 'bun add @midday/time-tracking'
    },
    documentation: 'https://docs.midday.ai/packages/time-tracking',
    repository: 'https://github.com/midday-ai/time-tracking',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['time', 'tracking', 'productivity', 'projects'],
    dependencies: ['@midday/ui', '@midday/projects', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Start Timer',
        description: 'Start tracking time for a project',
        language: 'typescript',
        code: `import { timeAPI } from '@midday/time-tracking';

const timer = await timeAPI.startTimer({
  projectId: 'project-123',
  description: 'Working on feature X',
  tags: ['development', 'frontend']
});`
      }
    ],
    api: [
      {
        endpoint: '/api/time/start',
        method: 'POST',
        description: 'Start a time tracking session',
        parameters: [
          { name: 'projectId', type: 'string', required: true, description: 'Project ID' },
          { name: 'description', type: 'string', required: false, description: 'Task description' }
        ]
      }
    ],
    demos: [
      {
        title: 'Time Tracker',
        description: 'Interactive time tracking interface',
        url: '/time',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-09-10'),
    downloads: 7800,
    stars: 134,
    issues: 5,
    contributors: 6
  },
  {
    id: 'queue',
    name: 'Job Queue System',
    description: 'Robust job queue system for background processing with monitoring and failure handling.',
    version: '3.0.1',
    category: 'Infrastructure',
    features: [
      'Background job processing',
      'Queue monitoring',
      'Retry mechanisms',
      'Job scheduling',
      'Priority queues',
      'Worker management',
      'Dead letter queues',
      'Performance metrics'
    ],
    icon: Zap,
    color: 'bg-yellow-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/queue',
      yarn: 'yarn add @midday/queue',
      pnpm: 'pnpm add @midday/queue',
      bun: 'bun add @midday/queue'
    },
    documentation: 'https://docs.midday.ai/packages/queue',
    repository: 'https://github.com/midday-ai/queue',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['queue', 'jobs', 'background', 'processing'],
    dependencies: ['@midday/utils', 'bull', 'redis', 'typescript'],
    devDependencies: ['@types/bull', 'jest', 'eslint'],
    peerDependencies: [],
    examples: [
      {
        title: 'Add Job to Queue',
        description: 'Add a background job to the queue',
        language: 'typescript',
        code: `import { queueAPI } from '@midday/queue';

await queueAPI.addJob('email-notification', {
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'John' }
}, {
  delay: 5000,
  attempts: 3
});`
      }
    ],
    api: [
      {
        endpoint: '/api/queue/jobs',
        method: 'POST',
        description: 'Add a job to the queue',
        parameters: [
          { name: 'type', type: 'string', required: true, description: 'Job type' },
          { name: 'data', type: 'object', required: true, description: 'Job data' }
        ]
      }
    ],
    demos: [
      {
        title: 'Queue Dashboard',
        description: 'Monitor and manage background jobs',
        url: '/queue',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-09-20'),
    downloads: 6500,
    stars: 98,
    issues: 8,
    contributors: 5
  },
  {
    id: 'documents',
    name: 'Document Management',
    description: 'Advanced document management system with OCR, search, and collaboration features.',
    version: '1.7.1',
    category: 'Platform',
    features: [
      'Document upload/storage',
      'OCR text extraction',
      'Full-text search',
      'Version control',
      'Collaboration tools',
      'Access permissions',
      'Document preview',
      'Metadata management'
    ],
    icon: FileText,
    color: 'bg-emerald-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/documents',
      yarn: 'yarn add @midday/documents',
      pnpm: 'pnpm add @midday/documents',
      bun: 'bun add @midday/documents'
    },
    documentation: 'https://docs.midday.ai/packages/documents',
    repository: 'https://github.com/midday-ai/documents',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['documents', 'ocr', 'search', 'collaboration'],
    dependencies: ['@midday/ui', '@midday/storage', 'tesseract.js', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Upload Document',
        description: 'Upload and process a document',
        language: 'typescript',
        code: `import { documentsAPI } from '@midday/documents';

const document = await documentsAPI.uploadDocument({
  file: fileData,
  name: 'contract.pdf',
  category: 'contracts',
  extractText: true,
  permissions: ['read:team', 'write:owner']
});`
      }
    ],
    api: [
      {
        endpoint: '/api/documents/upload',
        method: 'POST',
        description: 'Upload a document',
        parameters: [
          { name: 'file', type: 'file', required: true, description: 'Document file' },
          { name: 'name', type: 'string', required: true, description: 'Document name' }
        ]
      }
    ],
    demos: [
      {
        title: 'Document Manager',
        description: 'Browse and manage documents',
        url: '/documents',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-09-14'),
    downloads: 5900,
    stars: 112,
    issues: 4,
    contributors: 7
  },
  {
    id: 'table-components',
    name: '@midday/table-components',
    description: 'Flexible, data-source agnostic table components with built-in sorting, filtering, and pagination. Works with mock data, tRPC, REST APIs, or any data source.',
    version: '1.0.0',
    category: 'Core',
    features: [
      'Data Provider Pattern',
      'Type-safe with TypeScript',
      'TanStack Table integration',
      'Multiple data source support',
      'Advanced filtering',
      'Column sorting',
      'Pagination',
      'Row selection',
      'Column visibility',
      'Export functionality'
    ],
    icon: Table2,
    color: 'bg-cyan-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/table-components',
      yarn: 'yarn add @midday/table-components',
      pnpm: 'pnpm add @midday/table-components',
      bun: 'bun add @midday/table-components'
    },
    documentation: 'https://docs.midday.ai/packages/table-components',
    repository: 'https://github.com/midday-ai/table-components',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['table', 'data-grid', 'tanstack', 'filtering', 'sorting'],
    dependencies: ['@midday/ui', '@tanstack/react-table', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Basic Table with Mock Data',
        description: 'Render a table with mock data provider',
        language: 'typescript',
        code: `import { InvoiceTable } from "@midday/table-components/invoice-table";
import { MockDataProvider } from "@midday/table-components/providers/mock";

<MockDataProvider>
  <InvoiceTable />
</MockDataProvider>`
      },
      {
        title: 'Table with tRPC',
        description: 'Connect table to tRPC backend',
        language: 'typescript',
        code: `import { InvoiceTable } from "@midday/table-components/invoice-table";
import { TRPCDataProvider } from "@midday/table-components/providers/trpc";

<TRPCDataProvider>
  <InvoiceTable />
</TRPCDataProvider>`
      }
    ],
    api: [
      {
        endpoint: '/api/table/data',
        method: 'GET',
        description: 'Fetch table data with filtering and sorting',
        parameters: [
          { name: 'sort', type: 'string', required: false, description: 'Sort column and direction' },
          { name: 'filter', type: 'object', required: false, description: 'Filter criteria' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page' }
        ],
        response: '{ data: T[], total: number, page: number }'
      }
    ],
    demos: [
      {
        title: 'Invoice Table Demo',
        description: 'Interactive invoice table with all features',
        url: '/packages/table-components',
        type: 'interactive'
      },
      {
        title: 'Customer Table Demo',
        description: 'Customer management table',
        url: '/customers',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-09-22'),
    updatedAt: new Date('2024-09-22'),
    downloads: 2150,
    stars: 45,
    issues: 2,
    contributors: 3
  },
  {
    id: 'invoice-components',
    name: '@midday/invoice-components',
    description: 'Complete invoice management components with preview, PDF generation, sharing, and email functionality. Perfect for SaaS billing and invoicing systems.',
    version: '1.0.0',
    category: 'Core',
    features: [
      'HTML and PDF preview',
      'PDF generation and download',
      'Share via link with expiry',
      'Password protection',
      'Email with attachments',
      'QR code generation',
      'Print support',
      'Multiple templates',
      'Customizable actions',
      'Real-time preview'
    ],
    icon: FileText,
    color: 'bg-violet-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/invoice-components',
      yarn: 'yarn add @midday/invoice-components',
      pnpm: 'pnpm add @midday/invoice-components',
      bun: 'bun add @midday/invoice-components'
    },
    documentation: 'https://docs.midday.ai/packages/invoice-components',
    repository: 'https://github.com/midday-ai/invoice-components',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['invoice', 'pdf', 'billing', 'preview', 'share'],
    dependencies: ['@midday/ui', '@midday/invoice-core', '@react-pdf/renderer', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Invoice Preview',
        description: 'Display invoice with preview capabilities',
        language: 'typescript',
        code: `import { InvoicePreview } from "@midday/invoice-components/preview";

<InvoicePreview 
  invoice={invoice}
  template="default"
  showActions={true}
/>`
      },
      {
        title: 'Invoice Sharing',
        description: 'Share invoice with various options',
        language: 'typescript',
        code: `import { InvoiceShareDialog } from "@midday/invoice-components/share";
import { generateShareableLink } from "@midday/invoice-components";

const link = await generateShareableLink(invoice, {
  expiresIn: '7d',
  password: 'secure123',
  allowDownload: true,
  requireEmail: false
});`
      }
    ],
    api: [
      {
        endpoint: '/api/invoice/pdf',
        method: 'POST',
        description: 'Generate PDF from invoice data',
        parameters: [
          { name: 'invoice', type: 'Invoice', required: true, description: 'Invoice data' },
          { name: 'template', type: 'string', required: false, description: 'Template to use' }
        ],
        response: 'Blob (PDF file)'
      },
      {
        endpoint: '/api/invoice/share',
        method: 'POST',
        description: 'Generate shareable link',
        parameters: [
          { name: 'invoiceId', type: 'string', required: true, description: 'Invoice ID' },
          { name: 'options', type: 'ShareOptions', required: false, description: 'Share options' }
        ],
        response: '{ url: string, expiresAt: string }'
      }
    ],
    demos: [
      {
        title: 'Invoice Preview',
        description: 'Live invoice preview with actions',
        url: '/invoices',
        type: 'interactive'
      },
      {
        title: 'Share Dialog',
        description: 'Interactive sharing options demo',
        url: '/packages/invoice-components',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-09-22'),
    updatedAt: new Date('2024-09-22'),
    downloads: 1850,
    stars: 38,
    issues: 1,
    contributors: 2
  },
  {
    id: 'filter-components',
    name: '@midday/filter-components',
    description: 'Advanced filtering components with search fields, date range pickers, and multi-select filters. Perfect for building powerful data filtering interfaces.',
    version: '1.0.0',
    category: 'Core',
    features: [
      'SearchField with debouncing',
      'DateRangePicker with presets',
      'MultiSelectFilter with checkboxes',
      'Advanced filter operators',
      'Filter state management',
      'Keyboard navigation',
      'Accessibility support',
      'Custom filter providers'
    ],
    icon: Filter,
    color: 'bg-emerald-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/filter-components',
      yarn: 'yarn add @midday/filter-components',
      pnpm: 'pnpm add @midday/filter-components',
      bun: 'bun add @midday/filter-components'
    },
    documentation: 'https://docs.midday.ai/packages/filter-components',
    repository: 'https://github.com/midday-ai/filter-components',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['filter', 'search', 'date-picker', 'multi-select', 'ui'],
    dependencies: ['@midday/ui', '@tanstack/react-query', 'date-fns', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Basic Search Field',
        description: 'Simple search field with debouncing',
        language: 'typescript',
        code: `import { SearchField } from "@midday/filter-components/search-field";

<SearchField
  placeholder="Search customers..."
  onSearch={(query) => console.log('Search:', query)}
  debounceMs={300}
/>`
      },
      {
        title: 'Date Range Picker',
        description: 'Date range picker with preset options',
        language: 'typescript',
        code: `import { DateRangePicker } from "@midday/filter-components/date-range-picker";

<DateRangePicker
  presets={['last-7-days', 'last-30-days', 'last-quarter']}
  onRangeChange={(range) => console.log('Range:', range)}
  placeholder="Select date range..."
/>`
      },
      {
        title: 'Multi-Select Filter',
        description: 'Multi-select filter with search and groups',
        language: 'typescript',
        code: `import { MultiSelectFilter } from "@midday/filter-components/multi-select-filter";

<MultiSelectFilter
  options={[
    { label: 'Active', value: 'active', group: 'Status' },
    { label: 'Inactive', value: 'inactive', group: 'Status' },
    { label: 'VIP', value: 'vip', group: 'Type' }
  ]}
  onSelectionChange={(selected) => console.log('Selected:', selected)}
  placeholder="Filter by status..."
/>`
      }
    ],
    api: [
      {
        endpoint: '/api/filters/search',
        method: 'GET',
        description: 'Search with filters applied',
        parameters: [
          { name: 'query', type: 'string', required: false, description: 'Search query' },
          { name: 'filters', type: 'FilterCriteria[]', required: false, description: 'Applied filters' },
          { name: 'dateRange', type: 'DateRange', required: false, description: 'Date range filter' }
        ],
        response: '{ results: T[], total: number, facets: FilterFacet[] }'
      }
    ],
    demos: [
      {
        title: 'Filter Components Demo',
        description: 'Interactive demo of all filter components',
        url: '/packages/filter-components',
        type: 'interactive'
      },
      {
        title: 'Advanced Filtering',
        description: 'Complex filtering example with multiple criteria',
        url: '/customers?demo=filters',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-09-23'),
    updatedAt: new Date('2024-09-23'),
    downloads: 890,
    stars: 22,
    issues: 0,
    contributors: 2
  },
  {
    id: 'overlay-components',
    name: '@midday/overlay-components',
    description: 'Flexible overlay components including modals, sheets, and command palettes. Built for modern applications with keyboard navigation and accessibility.',
    version: '1.0.0',
    category: 'Core',
    features: [
      'BaseSheet with drawer behavior',
      'BaseModal with backdrop',
      'CommandPalette with search',
      'Focus management',
      'Keyboard navigation',
      'Escape key handling',
      'Portal rendering',
      'Animation support'
    ],
    icon: Layers,
    color: 'bg-blue-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/overlay-components',
      yarn: 'yarn add @midday/overlay-components',
      pnpm: 'pnpm add @midday/overlay-components',
      bun: 'bun add @midday/overlay-components'
    },
    documentation: 'https://docs.midday.ai/packages/overlay-components',
    repository: 'https://github.com/midday-ai/overlay-components',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['modal', 'sheet', 'overlay', 'command-palette', 'accessibility'],
    dependencies: ['@midday/ui', '@radix-ui/react-dialog', 'cmdk', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Basic Sheet',
        description: 'Side sheet overlay with content',
        language: 'typescript',
        code: `import { BaseSheet } from "@midday/overlay-components/base-sheet";

<BaseSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  side="right"
  title="Settings"
>
  <div className="p-6">
    <p>Sheet content goes here</p>
  </div>
</BaseSheet>`
      },
      {
        title: 'Modal Dialog',
        description: 'Centered modal with backdrop',
        language: 'typescript',
        code: `import { BaseModal } from "@midday/overlay-components/base-modal";

<BaseModal
  open={showModal}
  onOpenChange={setShowModal}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
>
  <div className="flex gap-2 justify-end">
    <Button variant="outline" onClick={() => setShowModal(false)}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>
      Confirm
    </Button>
  </div>
</BaseModal>`
      },
      {
        title: 'Command Palette',
        description: 'Search-powered command interface',
        language: 'typescript',
        code: `import { CommandPalette } from "@midday/overlay-components/command-palette";

<CommandPalette
  open={showCommands}
  onOpenChange={setShowCommands}
  placeholder="Type a command..."
  commands={[
    { id: 'new-customer', label: 'New Customer', action: () => navigate('/customers/new') },
    { id: 'new-invoice', label: 'New Invoice', action: () => navigate('/invoices/new') }
  ]}
/>`
      }
    ],
    api: [
      {
        endpoint: '/api/overlay/state',
        method: 'GET',
        description: 'Get current overlay states',
        parameters: [
          { name: 'component', type: 'string', required: false, description: 'Specific overlay component' }
        ],
        response: '{ overlays: OverlayState[], active: string[] }'
      }
    ],
    demos: [
      {
        title: 'Overlay Components Demo',
        description: 'Interactive demo of all overlay components',
        url: '/packages/overlay-components',
        type: 'interactive'
      },
      {
        title: 'Command Palette',
        description: 'Searchable command interface demo',
        url: '/command-palette-demo',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-09-23'),
    updatedAt: new Date('2024-09-23'),
    downloads: 1240,
    stars: 31,
    issues: 1,
    contributors: 3
  },
  {
    id: 'crud-components',
    name: '@midday/crud-components',
    description: 'Complete CRUD operation components with create, edit, and bulk edit sheets. Streamlined data management with validation and state handling.',
    version: '1.0.0',
    category: 'Core',
    features: [
      'CreateSheet for new records',
      'EditSheet for modifications',
      'BulkEditSheet for multiple items',
      'Form validation integration',
      'Optimistic updates',
      'Error handling',
      'Loading states',
      'Keyboard shortcuts'
    ],
    icon: Edit,
    color: 'bg-orange-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/crud-components',
      yarn: 'yarn add @midday/crud-components',
      pnpm: 'pnpm add @midday/crud-components',
      bun: 'bun add @midday/crud-components'
    },
    documentation: 'https://docs.midday.ai/packages/crud-components',
    repository: 'https://github.com/midday-ai/crud-components',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['crud', 'create', 'edit', 'form', 'sheet', 'validation'],
    dependencies: ['@midday/ui', '@midday/overlay-components', 'react-hook-form', 'zod', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Create Sheet',
        description: 'Sheet for creating new records',
        language: 'typescript',
        code: `import { CreateSheet } from "@midday/crud-components/create-sheet";

<CreateSheet
  open={showCreate}
  onOpenChange={setShowCreate}
  title="Create Customer"
  schema={customerSchema}
  onSubmit={async (data) => {
    await createCustomer(data);
    setShowCreate(false);
  }}
  fields={[
    { name: 'name', label: 'Customer Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' }
  ]}
/>`
      },
      {
        title: 'Edit Sheet',
        description: 'Sheet for editing existing records',
        language: 'typescript',
        code: `import { EditSheet } from "@midday/crud-components/edit-sheet";

<EditSheet
  open={showEdit}
  onOpenChange={setShowEdit}
  title="Edit Customer"
  schema={customerSchema}
  defaultValues={selectedCustomer}
  onSubmit={async (data) => {
    await updateCustomer(selectedCustomer.id, data);
    setShowEdit(false);
  }}
  fields={[
    { name: 'name', label: 'Customer Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'status', label: 'Status', type: 'select', options: statusOptions }
  ]}
/>`
      },
      {
        title: 'Bulk Edit Sheet',
        description: 'Sheet for editing multiple records',
        language: 'typescript',
        code: `import { BulkEditSheet } from "@midday/crud-components/bulk-edit-sheet";

<BulkEditSheet
  open={showBulkEdit}
  onOpenChange={setShowBulkEdit}
  title="Bulk Edit Customers"
  selectedItems={selectedCustomers}
  schema={bulkCustomerSchema}
  onSubmit={async (data) => {
    await bulkUpdateCustomers(selectedCustomers.map(c => c.id), data);
    setShowBulkEdit(false);
  }}
  fields={[
    { name: 'status', label: 'Status', type: 'select', options: statusOptions },
    { name: 'tags', label: 'Tags', type: 'multi-select', options: tagOptions }
  ]}
/>`
      }
    ],
    api: [
      {
        endpoint: '/api/crud/create',
        method: 'POST',
        description: 'Create a new record',
        parameters: [
          { name: 'data', type: 'object', required: true, description: 'Record data' },
          { name: 'type', type: 'string', required: true, description: 'Record type' }
        ],
        response: '{ id: string, ...data }'
      },
      {
        endpoint: '/api/crud/update/:id',
        method: 'PUT',
        description: 'Update an existing record',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Record ID' },
          { name: 'data', type: 'object', required: true, description: 'Updated data' }
        ],
        response: '{ id: string, ...data }'
      },
      {
        endpoint: '/api/crud/bulk-update',
        method: 'PUT',
        description: 'Bulk update multiple records',
        parameters: [
          { name: 'ids', type: 'string[]', required: true, description: 'Record IDs' },
          { name: 'data', type: 'object', required: true, description: 'Update data' }
        ],
        response: '{ updated: number, items: Record[] }'
      }
    ],
    demos: [
      {
        title: 'CRUD Operations Demo',
        description: 'Interactive demo of all CRUD components',
        url: '/packages/crud-components',
        type: 'interactive'
      },
      {
        title: 'Customer Management',
        description: 'Full CRUD example with customers',
        url: '/customers?demo=crud',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-09-23'),
    updatedAt: new Date('2024-09-23'),
    downloads: 754,
    stars: 19,
    issues: 0,
    contributors: 2
  },
  {
    id: 'form-components',
    name: '@midday/form-components',
    description: 'Specialized form input components including text fields, currency fields, and file upload components. Built for business applications with validation.',
    version: '1.0.0',
    category: 'Core',
    features: [
      'TextField with validation',
      'CurrencyField with formatting',
      'FileUploadField with preview',
      'Form validation integration',
      'Error state handling',
      'Accessibility features',
      'Custom validators',
      'Auto-formatting'
    ],
    icon: FormInput,
    color: 'bg-purple-500',
    status: 'stable',
    installation: {
      npm: 'npm install @midday/form-components',
      yarn: 'yarn add @midday/form-components',
      pnpm: 'pnpm add @midday/form-components',
      bun: 'bun add @midday/form-components'
    },
    documentation: 'https://docs.midday.ai/packages/form-components',
    repository: 'https://github.com/midday-ai/form-components',
    license: 'MIT',
    author: 'Midday Team',
    keywords: ['form', 'input', 'currency', 'file-upload', 'validation'],
    dependencies: ['@midday/ui', 'react-hook-form', 'react-currency-input-field', 'react-dropzone', 'typescript'],
    devDependencies: ['@types/react', 'jest', 'eslint'],
    peerDependencies: ['react >= 18.0.0'],
    examples: [
      {
        title: 'Text Field',
        description: 'Enhanced text input with validation',
        language: 'typescript',
        code: `import { TextField } from "@midday/form-components/text-field";

<TextField
  name="customerName"
  label="Customer Name"
  placeholder="Enter customer name..."
  validation={{
    required: "Customer name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" }
  }}
  helperText="Enter the full legal name of the customer"
/>`
      },
      {
        title: 'Currency Field',
        description: 'Currency input with automatic formatting',
        language: 'typescript',
        code: `import { CurrencyField } from "@midday/form-components/currency-field";

<CurrencyField
  name="amount"
  label="Invoice Amount"
  currency="USD"
  placeholder="0.00"
  validation={{
    required: "Amount is required",
    min: { value: 0.01, message: "Amount must be greater than 0" }
  }}
  prefix="$"
  decimalScale={2}
/>`
      },
      {
        title: 'File Upload Field',
        description: 'Drag-and-drop file upload with preview',
        language: 'typescript',
        code: `import { FileUploadField } from "@midday/form-components/file-upload-field";

<FileUploadField
  name="documents"
  label="Upload Documents"
  accept={{
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg']
  }}
  maxFiles={5}
  maxSize={10 * 1024 * 1024} // 10MB
  validation={{
    required: "At least one document is required"
  }}
  preview={true}
  onUpload={handleFileUpload}
/>`
      }
    ],
    api: [
      {
        endpoint: '/api/forms/validate',
        method: 'POST',
        description: 'Validate form data',
        parameters: [
          { name: 'data', type: 'object', required: true, description: 'Form data to validate' },
          { name: 'schema', type: 'string', required: true, description: 'Validation schema name' }
        ],
        response: '{ valid: boolean, errors: ValidationError[] }'
      },
      {
        endpoint: '/api/forms/upload',
        method: 'POST',
        description: 'Upload files from form',
        parameters: [
          { name: 'files', type: 'FileList', required: true, description: 'Files to upload' },
          { name: 'metadata', type: 'object', required: false, description: 'File metadata' }
        ],
        response: '{ urls: string[], metadata: FileMetadata[] }'
      }
    ],
    demos: [
      {
        title: 'Form Components Demo',
        description: 'Interactive demo of all form components',
        url: '/packages/form-components',
        type: 'interactive'
      },
      {
        title: 'Invoice Form',
        description: 'Complete invoice creation form',
        url: '/invoices/new?demo=form',
        type: 'interactive'
      }
    ],
    createdAt: new Date('2024-09-23'),
    updatedAt: new Date('2024-09-23'),
    downloads: 1120,
    stars: 27,
    issues: 1,
    contributors: 3
  }
];

// API functions
export const packagesAPI = {
  async getPackages(): Promise<MockPackage[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPackages;
  },

  async getPackage(id: string): Promise<MockPackage | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPackages.find(pkg => pkg.id === id) || null;
  },

  async getPackagesByCategory(category: string): Promise<MockPackage[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPackages.filter(pkg => pkg.category === category);
  },

  async searchPackages(query: string): Promise<MockPackage[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const lowerQuery = query.toLowerCase();
    return mockPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(lowerQuery) ||
      pkg.description.toLowerCase().includes(lowerQuery) ||
      pkg.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
      pkg.features.some(feature => feature.toLowerCase().includes(lowerQuery))
    );
  },

  async getPopularPackages(limit: number = 6): Promise<MockPackage[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPackages
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  },

  async getRecentPackages(limit: number = 6): Promise<MockPackage[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPackages
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  },

  async getPackageStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    totalDownloads: number;
    totalStars: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const byCategory = mockPackages.reduce((acc, pkg) => {
      acc[pkg.category] = (acc[pkg.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: mockPackages.length,
      byCategory,
      totalDownloads: mockPackages.reduce((sum, pkg) => sum + pkg.downloads, 0),
      totalStars: mockPackages.reduce((sum, pkg) => sum + pkg.stars, 0)
    };
  }
};

export { mockPackages };
export default mockPackages;