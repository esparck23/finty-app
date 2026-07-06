import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(['income', 'expense', 'exchange']),
});

export type Category = z.infer<typeof CategorySchema>;

export const TransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'exchange']),
  amount_usd: z.number().min(0),
  amount_bs: z.number().min(0),
  currency_primary: z.enum(['USD', 'Bs']),
  category_id: z.string().min(1, 'Categoría requerida'),
  description: z.string().optional().default(''),
  receipt_url: z.string().optional().default(''),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  receipt_type: z.enum(['invoice', 'transfer']).nullable().optional(),
  provider_name: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  document_type: z.enum(['rif', 'ci']).nullable().optional(),
  transfer_provider: z.string().nullable().optional(),
  transfer_operation: z.string().nullable().optional(),
  original_image_url: z.string().nullable().optional(),
  processed_at: z.string().nullable().optional(),
});

export type TransactionInput = z.input<typeof TransactionSchema>;

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'exchange';
  amount_usd: number;
  amount_bs: number;
  currency_primary: 'USD' | 'Bs';
  category_id: string;
  description: string | null;
  receipt_url: string | null;
  transaction_date: string;
  receipt_type: 'invoice' | 'transfer' | null;
  provider_name: string | null;
  tax_id: string | null;
  document_type: 'rif' | 'ci' | null;
  transfer_provider: string | null;
  transfer_operation: string | null;
  original_image_url: string | null;
  processed_at: string | null;
  is_offline_sync: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface AuditEntry {
  id: string;
  transaction_id: string | null;
  user_id: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values: string | null;
  new_values: string | null;
  created_at: string;
}
