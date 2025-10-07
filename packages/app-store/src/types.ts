// App store types
export interface App {
  id: string;
  name: string;
  active: boolean;
  logo: string | React.ComponentType;
  short_description: string;
  description?: string;
  images?: string[];
  category?: string;
  onInitialize?: () => void | Promise<void>;
  settings?: AppSetting[];
}

export interface AppSetting {
  id: string;
  label: string;
  description?: string;
  type: "switch" | "text" | "select";
  value: boolean | string;
  options?: { label: string; value: string }[];
}

export interface UnifiedApp {
  id: string;
  name: string;
  category: string;
  active: boolean;
  logo?: string | React.ComponentType;
  short_description?: string;
  description?: string;
  images: string[];
  installed: boolean;
  type: "official" | "external";
  onInitialize?: () => void | Promise<void>;
  settings?: AppSetting[];
  userSettings?: Record<string, any>;
  // External app specific fields
  clientId?: string;
  scopes?: string[];
  developerName?: string;
  website?: string;
  installUrl?: string;
  screenshots?: string[];
  overview?: string;
  createdAt?: string;
  status?: string;
  lastUsedAt?: string;
}
