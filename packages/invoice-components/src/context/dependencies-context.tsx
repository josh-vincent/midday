"use client";

import React, { createContext, useContext } from "react";
import type { InvoiceComponentDependencies } from "../types/dependencies";

const DependenciesContext = createContext<InvoiceComponentDependencies | null>(
  null
);

export function InvoiceDependenciesProvider({
  children,
  dependencies,
}: {
  children: React.ReactNode;
  dependencies: InvoiceComponentDependencies;
}) {
  return (
    <DependenciesContext.Provider value={dependencies}>
      {children}
    </DependenciesContext.Provider>
  );
}

export function useDependencies(): InvoiceComponentDependencies {
  const context = useContext(DependenciesContext);
  if (!context) {
    throw new Error(
      "useDependencies must be used within InvoiceDependenciesProvider. " +
        "Make sure to wrap your components with <InvoiceDependenciesProvider>."
    );
  }
  return context;
}

// Individual dependency hooks for convenience
export function useTRPC() {
  const { trpc } = useDependencies();
  return trpc;
}

export function useUserQuery() {
  const { useUserQuery } = useDependencies();
  return useUserQuery();
}

export function useUpload() {
  const { useUpload } = useDependencies();
  return useUpload();
}

export function useZodForm<T>(schema: any) {
  const { useZodForm } = useDependencies();
  return useZodForm<T>(schema);
}

export function useCustomerParams() {
  const { useCustomerParams } = useDependencies();
  return useCustomerParams();
}

// Export Editor component directly for use in JSX
export function Editor(props: any) {
  const { Editor: EditorComponent } = useDependencies();
  return <EditorComponent {...props} />;
}