# Pivot - Available Pages & Features

## ✅ Existing Pages (All Copied from Midday)

### Main Application Pages

1. **Dashboard** (`/`)
   - Overview with quick actions
   - Jobs, Invoices, Customers cards
   - Setup wizard for new users

2. **Jobs** (`/jobs`)
   - Job listing and management
   - Bulk actions
   - Link to customers and invoices
   - Search and filters

3. **Invoices** (`/invoices`)
   - Invoice listing
   - Create, edit, delete
   - Invoice templates
   - PDF generation
   - Status tracking (draft, sent, paid, overdue)

4. **Customers** (`/customers`)
   - Customer management (CRUD)
   - Customer details
   - Linked jobs and invoices

5. **Documents/Vault** (`/documents`)
   - File upload and storage
   - Document tagging
   - Preview and download
   - Search and filter

6. **Reports** (`/reports`)
   - Financial analytics
   - Charts (revenue, profit, burn rate, expenses)
   - Custom date ranges
   - Multiple chart types

7. **Gatekeeper** (`/gatekeeper`)
   - Access control/permissions

### Settings Pages (`/settings/*`)

- **General** (`/settings`)
- **Members** (`/settings/members`) - Team member management
- **Invoice** (`/settings/invoice`) - Invoice template configuration
- **Billing** (`/settings/billing`) - Subscription management
- **Pricing** (`/settings/pricing`) - Pricing plans
- **Developer** (`/settings/developer`) - API keys, OAuth apps

### Authentication Pages

- **Login** (`/login`)
- **Verify** (`/verify`)
- **Forgot Password** (`/forgot-password`)
- **Reset Password** (`/reset-password`)

### Other Pages

- **Teams** (`/teams`) - Team selection and creation
- **Setup** (`/setup`) - Initial setup wizard
- **Desktop Search** (`/desktop/search`)

## ⚠️ Features Available via Components (Not Standalone Pages)

These features exist but are accessed through modals/sheets rather than dedicated pages:

### Transactions
- **Component**: `TransactionsModal`
- **Components**:
  - `transaction-details.tsx`
  - `transactions-actions.tsx`
  - `transactions-search-filter.tsx`
- **Access**: Via modals, inbox matching, reports
- **Note**: Referenced as `/transactions` in links but no dedicated page exists

### Bank Connections
- **Components**:
  - `select-bank-accounts.tsx`
  - `manual-accounts.tsx`
  - `connection-status.tsx`
  - `delete-connection.tsx`
  - Bank providers: Plaid, GoCardless, Teller, EnableBanking
- **Access**: Via settings or connect flow
- **Note**: No dedicated page, handled via modals

### Categories
- **Components**:
  - `select-category.tsx`
  - `category.tsx`
  - `create-categories-modal.tsx`
  - `edit-category-modal.tsx`
- **Access**: Via transaction details and modals
- **Note**: No dedicated page

### Inbox/Email
- **Components**: Full inbox system in `components/inbox/*`
- **Access**: Likely via a modal or widget
- **Features**:
  - Email connections (Gmail)
  - Document matching
  - Transaction matching
  - Inbox management

## 🔧 Missing Dedicated Pages (Available via Components)

If you want standalone pages for these features, we would need to create:

1. **Transactions Page** (`/transactions`)
   - Transaction listing with table
   - Filters (date, category, bank account)
   - Search
   - Bulk actions
   - Transaction details sheet

2. **Bank Accounts Page** (`/accounts` or `/banking`)
   - Connected accounts list
   - Add new connection
   - Manual account creation
   - Account balance overview
   - Sync status

3. **Categories Page** (`/categories`)
   - Category management
   - Create/edit/delete categories
   - Subcategories
   - Transaction count per category

4. **Inbox Page** (`/inbox`)
   - Email inbox
   - Document inbox
   - Match documents to transactions
   - Email settings

## 📊 Feature Summary

| Feature | Status | Access Method |
|---------|--------|---------------|
| Jobs | ✅ Page | `/jobs` |
| Invoices | ✅ Page | `/invoices` |
| Customers | ✅ Page | `/customers` |
| Documents | ✅ Page | `/documents` |
| Reports | ✅ Page | `/reports` |
| Settings | ✅ Pages | `/settings/*` |
| Transactions | ⚠️ Components Only | Modals/Reports |
| Bank Accounts | ⚠️ Components Only | Modals/Settings |
| Categories | ⚠️ Components Only | Modals |
| Inbox | ⚠️ Components Only | Modals/Widgets |

## 🎯 Next Steps

Would you like me to:

1. **Create dedicated pages** for Transactions, Bank Accounts, Categories, and Inbox?
2. **Verify** that all existing pages work correctly with Pivot API?
3. **Add navigation** links to the sidebar for these features?
4. **Review** the component structure to understand how to best implement these pages?

All the components and logic already exist - we just need to create the page wrappers and routing!
