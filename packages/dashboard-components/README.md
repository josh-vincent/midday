# @midday/dashboard-components

Shared dashboard UI components used across dashboard and pivot-dashboard applications.

## Installation

```bash
pnpm add @midday/dashboard-components
```

## Usage

```tsx
import { AnimatedNumber, AmountRange } from '@midday/dashboard-components';

// Or import specific components
import { AvatarUpload } from '@midday/dashboard-components/avatar-upload';
```

## Available Components

### Core Components (215 total to be migrated)
- `AnimatedNumber` - Animated number transitions
- `AmountRange` - Range selector for amounts
- `AvatarUpload` - Avatar image upload component
- `AttachmentItem` - File attachment display
- `Category` - Category selector
- More components will be added during migration...

## Development

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Format code
pnpm format
```

## Component Structure

```
src/
├── components/
│   ├── animated-number.tsx
│   ├── amount-range.tsx
│   ├── avatar-upload.tsx
│   ├── billing/
│   │   ├── billing-orders.tsx
│   │   └── billing-subscriptions.tsx
│   ├── charts/
│   │   ├── average-days-to-payment.tsx
│   │   └── average-invoice-size.tsx
│   └── settings/
│       ├── change-email.tsx
│       ├── change-theme.tsx
│       └── change-timezone.tsx
└── index.ts
```

## Dependencies

- `@midday/ui` - Base UI components
- `@midday/utils` - Utility functions
- `react` - React library
- `react-dom` - React DOM

## Migration Status

- [ ] Phase 1: Simple components (0/50)
- [ ] Phase 2: Chart components (0/25)
- [ ] Phase 3: Settings components (0/30)
- [ ] Phase 4: Complex components (0/110)

Total: 0/215 components migrated