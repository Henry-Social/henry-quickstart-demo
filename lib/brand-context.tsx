"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ClientBrandConfig {
  brandName: string;
  logoUrl: string | null;
}

const BrandContext = createContext<ClientBrandConfig | null>(null);

export function BrandProvider({
  config,
  children,
}: {
  config: ClientBrandConfig;
  children: ReactNode;
}) {
  return (
    <BrandContext.Provider value={config}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return context;
}
