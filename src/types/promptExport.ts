export type PromptExportAction =
  | "quick_copy"
  | "quick_download"
  | "pro_copy"
  | "pro_export_prompt";

export type PromptExportTicket = {
  allowed: boolean;
  reservationId?: string;
};
