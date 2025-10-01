# Component Alignment Todo List

## Overview
Aligning all table, filter, modal, sheet, and form components across templates and dashboard apps to use shared packages.

## Phase 1: Core Table Package Enhancement ✅
- ✅ Add infinite scroll support to @midday/table-components
- ✅ Add grouped row support (from dashboard jobs table)
- ✅ Add bulk operations (select all, bulk delete, bulk export)
- ✅ Add column visibility toggle
- ✅ Add column resizing
- [ ] Add row expansion support
- ✅ Add sticky columns support
- [ ] Add virtual scrolling for large datasets
- ✅ Add CSV/Excel export utilities
- ✅ Add table state persistence (column order, visibility, sorting)

## Phase 2: Filter & Search Components Package ✅
- ✅ Create @midday/filter-components package
- ✅ Implement SearchField component with debouncing
- ✅ Implement DateRangePicker component
- ✅ Implement MultiSelectFilter component
- ✅ Implement TagFilter component
- ✅ Implement StatusFilter component
- ✅ Implement AmountRangeFilter component
- ✅ Implement SavedFilters component
- [ ] Implement FilterBuilder component (AI-enhanced)
- ✅ Add filter state management utilities

## Phase 3: Sheet & Modal System ✅
- ✅ Create @midday/overlay-components package
- ✅ Implement BaseSheet component
- ✅ Implement BaseModal component
- ✅ Implement ConfirmDialog component
- ✅ Implement CommandPalette component
- ✅ Implement nested sheet support
- ✅ Implement sheet/modal state management
- ✅ Add animation presets
- ✅ Add responsive behavior utilities

## Phase 4: CRUD Operations Package ✅
- ✅ Create @midday/crud-components package
- ✅ Implement CreateSheet component
- ✅ Implement EditSheet component
- ✅ Implement DeleteConfirmation component
- ✅ Implement BulkEditSheet component
- ✅ Implement ImportSheet component with CSV/Excel support
- ✅ Implement ExportDialog component
- ✅ Add optimistic updates support
- ✅ Add error recovery utilities

## Phase 5: Form Components Package ✅
- ✅ Create @midday/form-components package
- ✅ Implement FormField component (15 field types)
- ✅ Implement FormSection component
- ✅ Implement validation utilities
- ✅ Implement field dependencies
- ✅ Implement conditional fields
- ✅ Implement array field support
- ✅ Add form state management
- ✅ Add form submission utilities

## Migration Tasks 🔄

### Templates App Tables (12)
- [ ] Migrate transactions table to use @midday/table-components
- [ ] Migrate invoices table
- [ ] Migrate customers table
- [ ] Migrate jobs table
- [ ] Migrate packages table
- [ ] Migrate documents table
- [ ] Migrate time entries table
- [ ] Migrate reports table
- [ ] Migrate vendors table
- [ ] Migrate inventory table
- [ ] Migrate projects table
- [ ] Migrate analytics table

### Dashboard App Tables (7)
- [ ] Migrate transactions table to use @midday/table-components
- [ ] Migrate invoices table
- [ ] Migrate customers table
- [ ] Migrate jobs table
- [ ] Migrate inbox table
- [ ] Migrate tracker table
- [ ] Migrate exports table

### Sheet Components (24+)
- [ ] Migrate all CreateSheet components
- [ ] Migrate all EditSheet components
- [ ] Migrate all ImportSheet components
- [ ] Migrate all FilterSheet components
- [ ] Migrate all SettingsSheet components

### Modal Components (15+)
- [ ] Migrate all DeleteConfirmation modals
- [ ] Migrate all ShareDialog modals
- [ ] Migrate all PreviewModal components
- [ ] Migrate all ExportDialog components
- [ ] Migrate all SettingsModal components

## Status Legend
- [ ] Not started
- ⏳ In progress
- ✅ Completed
- ❌ Blocked

## Notes
- Using parallel subagents to work on different phases simultaneously
- Maintaining backward compatibility during migration
- All packages follow @midday/[name] convention
- Source of truth is in packages/, apps import from packages

Last updated: 2025-01-23