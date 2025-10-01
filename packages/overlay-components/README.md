# @midday/overlay-components

A comprehensive React package for overlay UI components including sheets, modals, dialogs, command palettes, and more. Built for the Midday application with TypeScript, animations, and accessibility in mind.

## Features

- 🎨 **Beautiful Animations** - Smooth animations with framer-motion
- 📱 **Responsive Design** - Mobile-first with adaptive behavior
- ♿ **Accessibility** - Full keyboard navigation and screen reader support
- 🎯 **Focus Management** - Automatic focus trapping and restoration
- 📚 **Stacked Overlays** - Proper z-index management for nested overlays
- 🎛️ **Customizable** - Flexible configuration and styling options
- 📦 **TypeScript** - Full TypeScript support with comprehensive types

## Components

### BaseSheet
Extensible sheet component with slide animations and swipe gestures.

```tsx
import { BaseSheet } from "@midday/overlay-components";

function CustomerSheet() {
  const [open, setOpen] = useState(false);
  
  return (
    <BaseSheet
      open={open}
      onOpenChange={setOpen}
      title="Customer Details"
      side="right"
      showCloseButton
    >
      <div>Customer content here</div>
    </BaseSheet>
  );
}
```

### BaseModal
Flexible modal/dialog component with multiple sizes and animations.

```tsx
import { BaseModal } from "@midday/overlay-components";

function CreateCustomerModal() {
  const [open, setOpen] = useState(false);
  
  return (
    <BaseModal
      open={open}
      onOpenChange={setOpen}
      title="Create Customer"
      size="lg"
      centered
    >
      <div>Modal content here</div>
    </BaseModal>
  );
}
```

### ConfirmDialog
Confirmation dialog with customizable actions and styling.

```tsx
import { ConfirmDialog } from "@midday/overlay-components";

function DeleteCustomerDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      type="danger"
      title="Delete Customer"
      message="Are you sure you want to delete this customer?"
      confirmAction={{
        label: "Delete",
        variant: "destructive",
        onClick: async () => {
          await deleteCustomer();
          setOpen(false);
        }
      }}
    />
  );
}
```

### CommandPalette
Command palette with search and keyboard navigation.

```tsx
import { CommandPalette } from "@midday/overlay-components";

function AppCommandPalette() {
  const [open, setOpen] = useState(false);
  
  const commands = [
    {
      id: "create-customer",
      label: "Create Customer",
      description: "Add a new customer",
      icon: <UserPlus />,
      shortcut: ["cmd", "shift", "c"],
      onSelect: () => console.log("Create customer")
    }
  ];
  
  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      items={commands}
      placeholder="Search commands..."
      showShortcuts
    />
  );
}
```

### NestedSheet
Sheet component with support for nesting and back navigation.

```tsx
import { NestedSheet } from "@midday/overlay-components";

function CustomerDetailsSheet() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  
  return (
    <>
      <NestedSheet open={open} onOpenChange={setOpen} title="Customer Details">
        <button onClick={() => setEditOpen(true)}>Edit Customer</button>
      </NestedSheet>
      
      <NestedSheet 
        open={editOpen} 
        onOpenChange={setEditOpen}
        title="Edit Customer"
        canGoBack
        onBack={() => setEditOpen(false)}
      >
        <div>Edit form content</div>
      </NestedSheet>
    </>
  );
}
```

### Drawer
Mobile-friendly drawer with swipe gestures and snap points.

```tsx
import { Drawer } from "@midday/overlay-components";

function MobileFilterDrawer() {
  const [open, setOpen] = useState(false);
  
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="Filter Options"
      side="bottom"
      snapPoints={[0.3, 0.6, 0.9]}
      showHandle
      swipeDismiss
    >
      <div>Filter content here</div>
    </Drawer>
  );
}
```

### Popover
Enhanced popover with positioning and animations.

```tsx
import { Popover } from "@midday/overlay-components";

function UserMenu() {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      showArrow
      trigger={<button>User Avatar</button>}
    >
      <div className="p-4 space-y-2">
        <div>Profile</div>
        <div>Settings</div>
        <div>Logout</div>
      </div>
    </Popover>
  );
}
```

### Tooltip
Enhanced tooltip with keyboard shortcuts and rich content.

```tsx
import { Tooltip, RichTooltip } from "@midday/overlay-components";

function ActionButton() {
  return (
    <Tooltip 
      content="Save changes"
      placement="top"
      shortcut={["cmd", "s"]}
      showArrow
    >
      <button><Save className="h-4 w-4" /></button>
    </Tooltip>
  );
}

function HelpButton() {
  return (
    <RichTooltip
      title="Customer Management"
      description="Create, edit, and manage your customers"
      icon={<Info />}
    >
      <button>Help</button>
    </RichTooltip>
  );
}
```

## Hooks

### useOverlayState
Hook for managing overlay open/closed state.

```tsx
import { useOverlayState } from "@midday/overlay-components";

function MyComponent() {
  const overlay = useOverlayState();
  
  return (
    <>
      <button onClick={overlay.open}>Open Modal</button>
      <BaseModal open={overlay.isOpen} onOpenChange={overlay.setOpen}>
        Content
      </BaseModal>
    </>
  );
}
```

### useStackedOverlays
Hook for managing multiple overlays with proper z-index stacking.

```tsx
import { useStackedOverlays, StackedOverlaysProvider } from "@midday/overlay-components";

function App() {
  return (
    <StackedOverlaysProvider>
      <MyApp />
    </StackedOverlaysProvider>
  );
}
```

### useResponsiveOverlay
Hook for responsive overlay behavior (modal on desktop, sheet on mobile).

```tsx
import { useResponsiveOverlay } from "@midday/overlay-components";

function ResponsiveOverlay() {
  const overlayType = useResponsiveOverlay("auto");
  
  return overlayType === "sheet" ? (
    <BaseSheet>Content</BaseSheet>
  ) : (
    <BaseModal>Content</BaseModal>
  );
}
```

## Animation Presets

The package includes several animation presets:

- `slide` - Slides in from the configured direction
- `fade` - Simple fade in/out
- `scale` - Scales up/down with fade
- `none` - No animation

You can also provide custom animations:

```tsx
<BaseModal
  animation={{
    preset: "scale",
    duration: 300,
    enter: { opacity: [0, 1], scale: [0.9, 1] },
    exit: { opacity: [1, 0], scale: [1, 0.9] }
  }}
>
  Content
</BaseModal>
```

## Configuration

All components support common configuration options:

- `animation` - Animation configuration
- `backdrop` - Backdrop appearance and behavior
- `focusTrap` - Focus management settings
- `closeOnEscape` - Whether to close on escape key
- `lockScroll` - Whether to lock body scroll when open

## Installation

This package is part of the Midday monorepo and uses the @midday/ui components as a foundation.

## TypeScript

Full TypeScript support is included with comprehensive type definitions for all components and their props.