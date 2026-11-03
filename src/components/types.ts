export interface LayerItem {
  name: string;
  role: string;
  engines?: string[];
}

export interface SpecRow {
  title: string;
  details?: string;
}

export interface LedgerItem {
  name: string;
  description?: string;
  status?: string;
  keywords?: string[];
  url?: string;
  github?: string;
}
