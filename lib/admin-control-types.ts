export type AdminControlTone = "neutral" | "positive" | "warning" | "danger";

export type AdminMetric = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: AdminControlTone;
};

export type AdminAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  href?: string;
};

export type AdminTableValue = string | number | boolean | null;

export type AdminTableColumn = {
  key: string;
  label: string;
  format?: "text" | "money" | "date" | "status" | "boolean" | "code";
};

export type AdminDataset = {
  id:
    | "orders"
    | "customers"
    | "products"
    | "payments"
    | "fulfilment"
    | "sessions"
    | "audit"
    | "supplier-sync"
    | "media-assets"
    | "media-placements";
  label: string;
  description: string;
  total: number;
  columns: AdminTableColumn[];
  rows: Array<Record<string, AdminTableValue>>;
};

export type AdminControlSnapshot = {
  generatedAt: string;
  metrics: AdminMetric[];
  alerts: AdminAlert[];
  datasets: AdminDataset[];
};
