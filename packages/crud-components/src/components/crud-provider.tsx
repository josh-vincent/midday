"use client";

import React from "react";
import type { BaseEntity, DataProvider } from "../types";

export interface CRUDContextValue<T extends BaseEntity> {
  dataProvider: DataProvider<T>;
  entityName: string;
  getEntityName?: (entity: T) => string;
  onError?: (error: Error, operation: string) => void;
  onSuccess?: (message: string) => void;
}

export interface CRUDProviderProps<T extends BaseEntity> {
  children: React.ReactNode;
  dataProvider: DataProvider<T>;
  entityName: string;
  getEntityName?: (entity: T) => string;
  onError?: (error: Error, operation: string) => void;
  onSuccess?: (message: string) => void;
}

const CRUDContext = React.createContext<CRUDContextValue<any> | null>(null);

/**
 * Provider component for CRUD operations context
 * 
 * @param props Provider configuration
 * @returns Context provider component
 * 
 * @example
 * ```tsx
 * const customerAPI: DataProvider<Customer> = {
 *   create: async (data) => await api.post('/customers', data),
 *   update: async (id, data) => await api.put(`/customers/${id}`, data),
 *   delete: async (id) => await api.delete(`/customers/${id}`),
 *   get: async (id) => await api.get(`/customers/${id}`),
 *   list: async (params) => await api.get('/customers', { params }),
 * };
 * 
 * <CRUDProvider
 *   dataProvider={customerAPI}
 *   entityName="Customer"
 *   getEntityName={(customer) => customer.name}
 * >
 *   <CustomerManagement />
 * </CRUDProvider>
 * ```
 */
export function CRUDProvider<T extends BaseEntity>({
  children,
  dataProvider,
  entityName,
  getEntityName,
  onError,
  onSuccess,
}: CRUDProviderProps<T>) {
  const contextValue: CRUDContextValue<T> = React.useMemo(
    () => ({
      dataProvider,
      entityName,
      getEntityName,
      onError,
      onSuccess,
    }),
    [dataProvider, entityName, getEntityName, onError, onSuccess]
  );

  return (
    <CRUDContext.Provider value={contextValue}>
      {children}
    </CRUDContext.Provider>
  );
}

/**
 * Hook to access CRUD context
 * 
 * @returns CRUD context value
 * 
 * @example
 * ```tsx
 * function CustomerList() {
 *   const { dataProvider, entityName } = useCRUDContext<Customer>();
 *   
 *   const crud = useCRUD({
 *     dataProvider,
 *     // ... other config
 *   });
 *   
 *   // ... component logic
 * }
 * ```
 */
export function useCRUDContext<T extends BaseEntity>(): CRUDContextValue<T> {
  const context = React.useContext(CRUDContext);
  
  if (!context) {
    throw new Error("useCRUDContext must be used within a CRUDProvider");
  }
  
  return context as CRUDContextValue<T>;
}