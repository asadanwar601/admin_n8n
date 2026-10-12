export type RagVisibilityRole = "public" | "customer" | "admin";

export interface AdminRagConfig {
  /** The backend Admin RAG endpoint URL (e.g., https://n8n-saas-host.onrender.com/v1/admin/rag or http://82.112.231.185:5680/webhook/admin-rag-ingest) */
  apiUrl: string;
  /** Optional CSS selector or HTMLElement to mount the Admin panel inline inside an existing Admin Portal */
  target?: string | HTMLElement;
  /** Display mode: "inline" mounts inside a page container; "floating" mounts a launcher bubble + modal */
  mode?: "inline" | "floating";
  /** Optional Bot identifier for multi-bot deployments */
  botId?: string;
  /** Header title displayed on the Admin RAG widget */
  title?: string;
  /** Subtitle displayed underneath the title */
  subtitle?: string;
  /** Primary theme color (hex or CSS color string, defaults to #201c18) */
  primaryColor?: string;
  /** Screen position when mode is "floating" */
  position?: "bottom-right" | "bottom-left";
  /** Optional pre-configured Admin Cred Basic Auth username */
  adminUsername?: string;
  /** Optional pre-configured Admin Cred Basic Auth password */
  adminPassword?: string;
  /** Optional sessionStorage key to persist Admin Cred for the current browser session */
  credentialsStorageKey?: string;
  /** Quick-pick category presets for the Document Category / Context Header field */
  defaultCategories?: string[];
  /** Accepted file types for upload (defaults to ".pdf,.doc,.docx,.csv,.xlsx,.txt,.md") */
  acceptFileTypes?: string;
  /** Footer branding text */
  footerText?: string;
  /** Optional callback invoked after a file or URL is ingested into chat_rag */
  onIngestSuccess?: (entry: AdminRagLogEntry, rawResponse: any) => void;
  /** Optional callback invoked when ingestion fails */
  onIngestError?: (error: Error) => void;
}

export interface AdminRagLogEntry {
  id: string;
  sourceType: "file" | "url";
  sourceLabel: string;
  category: string;
  visibility: RagVisibilityRole;
  status: "success" | "error";
  message: string;
  totalChunks?: number;
  timestamp: number;
}
