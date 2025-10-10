/**
 * @midday/dashboard-components
 *
 * Shared dashboard UI components used across dashboard and pivot-dashboard
 * This package contains all the business-specific components that are
 * duplicated between the two dashboard applications.
 */

// Export all shared dashboard components here
export { AnimatedNumber } from './components/animated-number';
export { AssignedUser } from './components/assigned-user';
export { AttachmentItem } from './components/attachment-item';
export type { Attachment } from './components/attachment-item';
export { Category, CategoryColor } from './components/category';
export { ChangeTheme } from './components/change-theme';
export { ColorPicker } from './components/color-picker';
export { ThemeSwitch } from './components/theme-switch';

// Components to be migrated:
// export * from './components/accept-invite-code';
// export * from './components/amount-range';