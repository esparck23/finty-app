export interface ScanResult {
  amount: number | null;
  currency: 'USD' | 'Bs' | null;
  date: string | null;
  rif_ci: string | null;
  category_name: string | null;
  concept: string | null;
  vendor: string | null;
  confidence: number;
  raw_text: string;

  // Campos adicionales para diferenciar Factura vs Transferencia
  operation?: string | null;
  reference?: string | null;
  number?: string | null;
  payer?: string | null;
  receiver?: string | null;
  beneficiary?: string | null;
  destination?: string | null;
  origin?: string | null;
  provider?: string | null;

  // Campos adicionales para el plan de viabilidad
  provider_name?: string | null;
  document_type?: 'rif' | 'ci' | null;
  transfer_provider?: string | null;
  transfer_operation?: string | null;
  receipt_type?: 'invoice' | 'transfer' | null;
}

export interface ScanError {
  error: string;
  detail?: string;
}
