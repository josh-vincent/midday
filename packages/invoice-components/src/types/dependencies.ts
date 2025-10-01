/**
 * Types for dependencies that must be provided by the consuming application
 */

import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import type { ZodSchema } from "zod";

// User types
export type User = {
  id: string;
  email: string;
  locale?: string;
  // Add other user properties as needed
};

// tRPC client type - this is a placeholder that apps should extend
export type TRPCClient = any;

// Hook return types
export type UseUserQueryReturn = UseQueryResult<User | null>;
export type UseUploadReturn = {
  uploadFile: (file: File) => Promise<{ url: string }>;
  isUploading: boolean;
};

// Editor component props
export type EditorProps = {
  content?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  className?: string;
};

// Dependencies context type
export interface InvoiceComponentDependencies {
  // tRPC client instance
  trpc: TRPCClient;

  // Hooks
  useUserQuery: () => UseUserQueryReturn;
  useUpload: () => UseUploadReturn;
  useZodForm: <T>(schema: ZodSchema<T>) => UseFormReturn<T>;
  useCustomerParams: () => any;

  // Components
  Editor: React.ComponentType<EditorProps>;
}

// Re-export common types
export type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";