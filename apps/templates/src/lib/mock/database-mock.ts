export interface MockTable {
  name: string;
  schema: string;
  columns: MockColumn[];
  primaryKey: string[];
  foreignKeys: MockForeignKey[];
  indexes: MockIndex[];
  rowCount: number;
  sizeInMB: number;
}

export interface MockColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
}

export interface MockForeignKey {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

export interface MockIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: "btree" | "hash" | "gin" | "gist";
}

export interface MockMigration {
  id: string;
  name: string;
  appliedAt: Date;
  version: string;
  checksum: string;
  executionTime: number;
  status: "applied" | "pending" | "failed";
}

export const mockTables: MockTable[] = [
  {
    name: "users",
    schema: "public",
    columns: [
      { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isForeignKey: false, isUnique: true },
      { name: "email", type: "varchar(255)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: true },
      { name: "full_name", type: "varchar(255)", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "avatar_url", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()", isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()", isPrimaryKey: false, isForeignKey: false, isUnique: false },
    ],
    primaryKey: ["id"],
    foreignKeys: [],
    indexes: [
      { name: "users_pkey", columns: ["id"], unique: true, type: "btree" },
      { name: "users_email_key", columns: ["email"], unique: true, type: "btree" },
    ],
    rowCount: 12543,
    sizeInMB: 2.4,
  },
  {
    name: "teams",
    schema: "public",
    columns: [
      { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isForeignKey: false, isUnique: true },
      { name: "name", type: "varchar(255)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "slug", type: "varchar(255)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: true },
      { name: "created_by", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, isUnique: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()", isPrimaryKey: false, isForeignKey: false, isUnique: false },
    ],
    primaryKey: ["id"],
    foreignKeys: [
      {
        column: "created_by",
        referencedTable: "users",
        referencedColumn: "id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    ],
    indexes: [
      { name: "teams_pkey", columns: ["id"], unique: true, type: "btree" },
      { name: "teams_slug_key", columns: ["slug"], unique: true, type: "btree" },
      { name: "teams_created_by_idx", columns: ["created_by"], unique: false, type: "btree" },
    ],
    rowCount: 3456,
    sizeInMB: 0.8,
  },
  {
    name: "invoices",
    schema: "public",
    columns: [
      { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isForeignKey: false, isUnique: true },
      { name: "invoice_number", type: "varchar(50)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: true },
      { name: "team_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, isUnique: false },
      { name: "customer_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, isUnique: false },
      { name: "amount", type: "decimal(10,2)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "currency", type: "varchar(3)", nullable: false, default: "'USD'", isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "status", type: "varchar(20)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "due_date", type: "date", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "paid_at", type: "timestamptz", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()", isPrimaryKey: false, isForeignKey: false, isUnique: false },
    ],
    primaryKey: ["id"],
    foreignKeys: [
      {
        column: "team_id",
        referencedTable: "teams",
        referencedColumn: "id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      {
        column: "customer_id",
        referencedTable: "customers",
        referencedColumn: "id",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    ],
    indexes: [
      { name: "invoices_pkey", columns: ["id"], unique: true, type: "btree" },
      { name: "invoices_invoice_number_key", columns: ["invoice_number"], unique: true, type: "btree" },
      { name: "invoices_team_id_idx", columns: ["team_id"], unique: false, type: "btree" },
      { name: "invoices_customer_id_idx", columns: ["customer_id"], unique: false, type: "btree" },
      { name: "invoices_status_idx", columns: ["status"], unique: false, type: "btree" },
    ],
    rowCount: 45678,
    sizeInMB: 12.3,
  },
  {
    name: "customers",
    schema: "public",
    columns: [
      { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isForeignKey: false, isUnique: true },
      { name: "team_id", type: "uuid", nullable: false, isPrimaryKey: false, isForeignKey: true, isUnique: false },
      { name: "name", type: "varchar(255)", nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "email", type: "varchar(255)", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "phone", type: "varchar(50)", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "address", type: "jsonb", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "metadata", type: "jsonb", nullable: true, isPrimaryKey: false, isForeignKey: false, isUnique: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()", isPrimaryKey: false, isForeignKey: false, isUnique: false },
    ],
    primaryKey: ["id"],
    foreignKeys: [
      {
        column: "team_id",
        referencedTable: "teams",
        referencedColumn: "id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    ],
    indexes: [
      { name: "customers_pkey", columns: ["id"], unique: true, type: "btree" },
      { name: "customers_team_id_idx", columns: ["team_id"], unique: false, type: "btree" },
      { name: "customers_metadata_idx", columns: ["metadata"], unique: false, type: "gin" },
    ],
    rowCount: 8923,
    sizeInMB: 4.5,
  },
];

export const mockMigrations: MockMigration[] = [
  {
    id: "001",
    name: "create_users_table",
    appliedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    version: "1.0.0",
    checksum: "a1b2c3d4",
    executionTime: 45,
    status: "applied",
  },
  {
    id: "002",
    name: "create_teams_table",
    appliedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    version: "1.0.0",
    checksum: "e5f6g7h8",
    executionTime: 32,
    status: "applied",
  },
  {
    id: "003",
    name: "create_customers_table",
    appliedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    version: "1.0.0",
    checksum: "i9j0k1l2",
    executionTime: 38,
    status: "applied",
  },
  {
    id: "004",
    name: "create_invoices_table",
    appliedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
    version: "1.0.0",
    checksum: "m3n4o5p6",
    executionTime: 52,
    status: "applied",
  },
  {
    id: "005",
    name: "add_stripe_fields",
    appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    version: "1.1.0",
    checksum: "q7r8s9t0",
    executionTime: 28,
    status: "applied",
  },
  {
    id: "006",
    name: "add_email_provider_config",
    appliedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    version: "1.2.0",
    checksum: "u1v2w3x4",
    executionTime: 41,
    status: "applied",
  },
  {
    id: "007",
    name: "create_queue_jobs_table",
    appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    version: "1.3.0",
    checksum: "y5z6a7b8",
    executionTime: 67,
    status: "applied",
  },
  {
    id: "008",
    name: "add_rls_policies",
    appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    version: "1.4.0",
    checksum: "c9d0e1f2",
    executionTime: 89,
    status: "applied",
  },
  {
    id: "009",
    name: "optimize_indexes",
    appliedAt: new Date(),
    version: "1.4.1",
    checksum: "g3h4i5j6",
    executionTime: 0,
    status: "pending",
  },
];

// Mock API functions
export const databaseAPI = {
  getTables: async (): Promise<MockTable[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTables;
  },

  getMigrations: async (): Promise<MockMigration[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMigrations;
  },

  executeQuery: async (query: string): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock query results
    if (query.toLowerCase().includes("select")) {
      return [
        { id: "1", name: "Sample Row 1", value: 100 },
        { id: "2", name: "Sample Row 2", value: 200 },
        { id: "3", name: "Sample Row 3", value: 300 },
      ];
    }
    return [];
  },

  getTableStats: async (tableName: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      rowCount: Math.floor(Math.random() * 10000) + 1000,
      sizeInMB: (Math.random() * 10 + 0.5).toFixed(1),
      indexCount: Math.floor(Math.random() * 5) + 2,
      lastVacuum: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      lastAnalyze: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    };
  },
};