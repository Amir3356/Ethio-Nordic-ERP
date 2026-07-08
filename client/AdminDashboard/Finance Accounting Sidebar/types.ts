export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parent_id: string | null;
  currency: string;
  cost_center: string | null;
  is_active: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  source_module: string;
  reference: string;
  status: 'draft' | 'posted' | 'reversed';
  created_by: string;
  approved_by: string;
  total_debit: number;
  total_credit: number;
  currency: string;
  exchange_rate: number;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

export interface APInvoice {
  id: string;
  supplier_id: string;
  supplier_name: string;
  invoice_no: string;
  po_ref: string;
  grn_ref: string | null;
  invoice_date: string;
  due_date: string;
  currency: string;
  amount: number;
  amount_etb: number;
  vat_amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'partially_paid' | 'paid' | 'overdue';
  payment_date: string | null;
  payment_ref: string | null;
  matched_po: boolean;
  matched_grn: boolean;
}

export interface ARInvoice {
  id: string;
  customer_id: string;
  customer_name: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'written_off';
  payment_date: string | null;
  payment_ref: string | null;
  days_overdue: number;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  date: string;
  description: string;
  type: 'debit' | 'credit';
  amount: number;
  balance_after: number;
  reference: string;
  reconciled: boolean;
  reconciled_date: string | null;
}

export interface Budget {
  id: string;
  cost_center: string;
  account_id: string;
  category: string;
  period: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_pct: number;
  status: 'within_budget' | 'over_budget' | 'under_budget';
}

export interface FixedAsset {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  account_id: string;
  acquisition_date: string;
  acquisition_cost: number;
  useful_life_years: number;
  depreciation_method: 'Straight Line' | 'Declining Balance' | 'Units of Production';
  salvage_value: number;
  annual_depreciation: number;
  monthly_depreciation: number;
  accumulated_depreciation: number;
  net_book_value: number;
  status: 'active' | 'disposed' | 'fully_depreciated';
  location: string;
}

export interface TaxRecord {
  id: string;
  tax_type: string;
  period: string;
  filing_date: string;
  output_vat?: number;
  input_vat?: number;
  net_vat_payable?: number;
  wht_collected?: number;
  wht_paid?: number;
  taxable_income?: number;
  tax_rate?: number;
  tax_amount?: number;
  status: 'accrued' | 'filed' | 'pending';
  payment_date: string | null;
  payment_ref: string | null;
  account_id: string;
}

export interface FinanceData {
  chart_of_accounts: ChartOfAccount[];
  journal_entries: JournalEntry[];
  journal_lines: JournalLine[];
  ap_invoices: APInvoice[];
  ar_invoices: ARInvoice[];
  bank_transactions: BankTransaction[];
  budgets: Budget[];
  fixed_assets: FixedAsset[];
  tax_records: TaxRecord[];
}
