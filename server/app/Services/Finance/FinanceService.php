<?php

namespace App\Services\Finance;

use App\Models\ApInvoice;
use App\Models\ArInvoice;
use App\Models\BankTransaction;
use App\Models\Budget;
use App\Models\ChartOfAccount;
use App\Models\FixedAsset;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\TaxRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FinanceService
{
    /** Manual journal entries above this ETB value require approval before posting (Step 3). */
    public const APPROVAL_THRESHOLD = 500000;

    // ─── Overview (feeds the Finance sidebar) ───────────────────

    public function overview(): JsonResponse
    {
        $arInvoices = ArInvoice::orderBy('invoice_date')->get()->map(function ($inv) {
            $daysOverdue = 0;
            if (!in_array($inv->status, ['paid', 'written_off'], true) && $inv->due_date->isPast()) {
                $daysOverdue = (int) $inv->due_date->diffInDays(now());
                if ($inv->status === 'sent') {
                    $inv->status = 'overdue';
                    $inv->save();
                }
            }
            return array_merge($inv->toArray(), ['days_overdue' => $daysOverdue]);
        });

        $budgets = Budget::orderBy('period')->get()->map(function ($b) {
            $variance = (float) $b->budget_amount - (float) $b->actual_amount;
            $pct = (float) $b->budget_amount > 0 ? round($variance / (float) $b->budget_amount * 100, 1) : 0;
            return array_merge($b->toArray(), [
                'variance' => $variance,
                'variance_pct' => $pct,
                'status' => $variance < 0 ? 'over_budget' : 'within_budget',
            ]);
        });

        $assets = FixedAsset::orderBy('asset_code')->get()->map(function ($a) {
            $annual = $a->useful_life_years > 0
                ? round(((float) $a->acquisition_cost - (float) $a->salvage_value) / $a->useful_life_years, 2)
                : 0;
            return array_merge($a->toArray(), [
                'annual_depreciation' => $annual,
                'monthly_depreciation' => round($annual / 12, 2),
                'net_book_value' => (float) $a->acquisition_cost - (float) $a->accumulated_depreciation,
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'chart_of_accounts' => ChartOfAccount::orderBy('code')->get(),
                'journal_entries' => JournalEntry::orderByDesc('date')->get(),
                'journal_lines' => JournalLine::orderBy('id')->get(),
                'ap_invoices' => ApInvoice::orderBy('invoice_date')->get(),
                'ar_invoices' => $arInvoices,
                'bank_transactions' => BankTransaction::orderBy('date')->get(),
                'budgets' => $budgets,
                'fixed_assets' => $assets,
                'tax_records' => TaxRecord::orderBy('period')->get(),
                'closed_periods' => $this->closedPeriods(),
            ],
        ]);
    }

    // ─── Posting Engine (double-entry core) ─────────────────────

    /**
     * Validates and posts a balanced double-entry journal. Used by manual
     * entries, AP/AR flows, depreciation, and integration listeners.
     *
     * @param array $header  date, description, source_module, reference, created_by, approved_by, currency, exchange_rate, status
     * @param array $lines   each: account_id, debit, credit, description
     */
    public function postEntry(array $header, array $lines): JournalEntry
    {
        $totalDebit = round(array_sum(array_column($lines, 'debit')), 2);
        $totalCredit = round(array_sum(array_column($lines, 'credit')), 2);

        if ($totalDebit <= 0 || abs($totalDebit - $totalCredit) > 0.01) {
            throw new \InvalidArgumentException(
                "Journal entry does not balance: debits {$totalDebit} vs credits {$totalCredit}."
            );
        }

        $period = substr($header['date'], 0, 7); // YYYY-MM
        if (in_array($period, $this->closedPeriods(), true)) {
            throw new \InvalidArgumentException("Period {$period} is closed. Reopen it before posting.");
        }

        foreach ($lines as $line) {
            if (!ChartOfAccount::whereKey($line['account_id'])->exists()) {
                throw new \InvalidArgumentException("Unknown account: {$line['account_id']}.");
            }
        }

        return DB::transaction(function () use ($header, $lines, $totalDebit, $totalCredit) {
            $entry = JournalEntry::create([
                'id' => $this->nextJournalId(),
                'date' => $header['date'],
                'description' => $header['description'],
                'source_module' => $header['source_module'] ?? 'Manual',
                'reference' => $header['reference'] ?? '',
                'status' => $header['status'] ?? 'posted',
                'created_by' => $header['created_by'] ?? 'System',
                'approved_by' => $header['approved_by'] ?? null,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'currency' => $header['currency'] ?? 'ETB',
                'exchange_rate' => $header['exchange_rate'] ?? 1.0,
            ]);

            foreach ($lines as $line) {
                JournalLine::create([
                    'id' => $this->nextLineId(),
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line['account_id'],
                    'debit' => $line['debit'] ?? 0,
                    'credit' => $line['credit'] ?? 0,
                    'description' => $line['description'] ?? null,
                ]);
            }

            if ($entry->status === 'posted') {
                $this->updateBudgetActuals($entry);
            }

            return $entry;
        });
    }

    /** Roll posted expense-account debits into the matching cost-center budget (Step 7). */
    private function updateBudgetActuals(JournalEntry $entry): void
    {
        foreach ($entry->lines as $line) {
            if ((float) $line->debit <= 0) {
                continue;
            }
            $account = ChartOfAccount::find($line->account_id);
            if (!$account || $account->type !== 'Expense') {
                continue;
            }
            $quarter = 'Q' . ceil((int) $entry->date->format('n') / 3);
            $period = $entry->date->format('Y') . '-' . $quarter;
            Budget::where('account_id', $account->id)
                ->where('period', $period)
                ->increment('actual_amount', (float) $line->debit);
        }
    }

    private function nextJournalId(): string
    {
        $year = now()->year;
        $last = JournalEntry::where('id', 'like', "JE-{$year}-%")->orderByDesc('id')->value('id');
        $seq = $last && preg_match('/JE-\d{4}-(\d+)/', $last, $m) ? (int) $m[1] + 1 : 1;
        return sprintf('JE-%d-%04d', $year, $seq);
    }

    private function nextLineId(): string
    {
        $last = JournalLine::orderByDesc(DB::raw('LENGTH(id)'))->orderByDesc('id')->value('id');
        $seq = $last && preg_match('/JL-(\d+)/', $last, $m) ? (int) $m[1] + 1 : 1;
        return sprintf('JL-%03d', $seq);
    }

    private function nextId(string $prefix, string $modelClass): string
    {
        $last = $modelClass::where('id', 'like', "{$prefix}%")->orderByDesc('id')->value('id');
        $seq = $last && preg_match('/(\d+)$/', $last, $m) ? (int) $m[1] + 1 : 1;
        return $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }

    // ─── Step 1: Chart of Accounts ──────────────────────────────

    public function storeAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:chart_of_accounts,code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:Asset,Liability,Equity,Revenue,Expense',
            'parent_id' => 'nullable|string|exists:chart_of_accounts,id',
            'currency' => 'sometimes|string|max:10',
            'cost_center' => 'nullable|string|max:100',
        ]);

        $validated['id'] = 'COA-' . $validated['code'];
        $validated['is_active'] = true;

        $account = ChartOfAccount::create($validated);

        return response()->json(['success' => true, 'data' => $account], 201);
    }

    public function updateAccount(Request $request, string $id): JsonResponse
    {
        $account = ChartOfAccount::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'currency' => 'sometimes|string|max:10',
            'cost_center' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $account->update($validated);

        return response()->json(['success' => true, 'data' => $account->fresh()]);
    }

    // ─── Step 3: Manual Journal Entries ─────────────────────────

    public function storeJournalEntry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string|max:1000',
            'reference' => 'nullable|string|max:255',
            'currency' => 'sometimes|string|max:10',
            'exchange_rate' => 'sometimes|numeric|min:0',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|string|exists:chart_of_accounts,id',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string|max:500',
        ]);

        $totalDebit = round(array_sum(array_column($validated['lines'], 'debit')), 2);
        $totalCredit = round(array_sum(array_column($validated['lines'], 'credit')), 2);

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => "Entry does not balance: total debits ({$totalDebit}) must equal total credits ({$totalCredit}).",
            ], 422);
        }

        // Above the value threshold the entry stays in draft pending approval (Step 3).
        $needsApproval = $totalDebit > self::APPROVAL_THRESHOLD;

        try {
            $entry = $this->postEntry([
                'date' => $validated['date'],
                'description' => $validated['description'],
                'source_module' => 'Manual',
                'reference' => $validated['reference'] ?? '',
                'status' => $needsApproval ? 'draft' : 'posted',
                'created_by' => $request->user()?->name ?? 'Finance Staff',
                'approved_by' => $needsApproval ? null : 'Auto-approved',
                'currency' => $validated['currency'] ?? 'ETB',
                'exchange_rate' => $validated['exchange_rate'] ?? 1.0,
            ], $validated['lines']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        // Step 7: real-time budget check — expense lines breaching the
        // cost-center budget are flagged for management override.
        $budgetWarnings = [];
        foreach ($validated['lines'] as $line) {
            if (($line['debit'] ?? 0) <= 0) {
                continue;
            }
            $account = ChartOfAccount::find($line['account_id']);
            if (!$account || $account->type !== 'Expense') {
                continue;
            }
            $quarter = 'Q' . ceil((int) date('n', strtotime($validated['date'])) / 3);
            $period = date('Y', strtotime($validated['date'])) . '-' . $quarter;
            $budget = Budget::where('account_id', $account->id)->where('period', $period)->first();
            if ($budget && (float) $budget->actual_amount > (float) $budget->budget_amount) {
                $over = (float) $budget->actual_amount - (float) $budget->budget_amount;
                $budgetWarnings[] = "Budget breach: {$account->name} ({$budget->cost_center}, {$period}) is over budget by {$over} — flagged for management override.";
            }
        }

        return response()->json([
            'success' => true,
            'message' => $needsApproval
                ? 'Entry saved as draft: value exceeds the approval threshold and requires approval.'
                : 'Journal entry posted.',
            'budget_warnings' => $budgetWarnings,
            'data' => $entry->load('lines'),
        ], 201);
    }

    public function approveJournalEntry(Request $request, string $id): JsonResponse
    {
        $entry = JournalEntry::findOrFail($id);

        if ($entry->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Entry is not awaiting approval.'], 422);
        }

        $entry->update([
            'status' => 'posted',
            'approved_by' => $request->user()?->name ?? 'Finance Manager',
        ]);
        $this->updateBudgetActuals($entry->fresh());

        return response()->json(['success' => true, 'data' => $entry->fresh()]);
    }

    // ─── Step 4: Accounts Payable ───────────────────────────────

    public function storeApInvoice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|string|max:100',
            'supplier_name' => 'required|string|max:255',
            'invoice_no' => 'required|string|max:100',
            'po_ref' => 'nullable|string|max:100',
            'grn_ref' => 'nullable|string|max:100',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'currency' => 'sometimes|string|max:10',
            'amount' => 'required|numeric|min:0.01',
            'amount_etb' => 'sometimes|numeric|min:0',
            'vat_amount' => 'sometimes|numeric|min:0',
        ]);

        $validated['id'] = $this->nextId('API-' . now()->year . '-', ApInvoice::class);
        $validated['matched_po'] = !empty($validated['po_ref']);
        $validated['matched_grn'] = !empty($validated['grn_ref']);
        $validated['status'] = 'pending_approval';
        $validated['amount_etb'] = $validated['amount_etb'] ?? $validated['amount'];

        $invoice = ApInvoice::create($validated);

        return response()->json(['success' => true, 'data' => $invoice], 201);
    }

    public function approveApInvoice(string $id): JsonResponse
    {
        $invoice = ApInvoice::findOrFail($id);

        // Three-way match: supplier invoice + Purchase Order + Goods Receipt Note.
        if (!$invoice->matched_po || !$invoice->matched_grn) {
            return response()->json([
                'success' => false,
                'message' => 'Three-way match incomplete: the invoice must be matched to both a PO and a GRN before approval.',
            ], 422);
        }

        if ($invoice->status !== 'pending_approval') {
            return response()->json(['success' => false, 'message' => 'Invoice is not pending approval.'], 422);
        }

        $invoice->update(['status' => 'approved']);

        // Automated sub-ledger posting (Step 2): expense/inventory vs payable.
        $payableAccount = $invoice->currency === 'ETB' ? 'COA-2010' : 'COA-2020';
        $this->postEntry([
            'date' => now()->toDateString(),
            'description' => "Supplier invoice {$invoice->invoice_no} - {$invoice->supplier_name}",
            'source_module' => 'Procurement',
            'reference' => $invoice->grn_ref ?? $invoice->invoice_no,
            'created_by' => 'System',
            'approved_by' => 'Finance Manager',
            'currency' => $invoice->currency,
        ], [
            ['account_id' => 'COA-5010', 'debit' => (float) $invoice->amount_etb, 'credit' => 0, 'description' => "Purchases - {$invoice->supplier_name}"],
            ['account_id' => $payableAccount, 'debit' => 0, 'credit' => (float) $invoice->amount_etb, 'description' => "AP payable to {$invoice->supplier_name}"],
        ]);

        return response()->json(['success' => true, 'data' => $invoice->fresh()]);
    }

    public function payApInvoice(Request $request, string $id): JsonResponse
    {
        $invoice = ApInvoice::findOrFail($id);

        if (!in_array($invoice->status, ['approved', 'partially_paid'], true)) {
            return response()->json(['success' => false, 'message' => 'Invoice must be approved before payment.'], 422);
        }

        $validated = $request->validate([
            'payment_ref' => 'required|string|max:100',
            'bank_account_id' => 'sometimes|string|exists:chart_of_accounts,id',
        ]);

        $bankAccount = $validated['bank_account_id'] ?? ($invoice->currency === 'ETB' ? 'COA-1020' : 'COA-1021');
        $payableAccount = $invoice->currency === 'ETB' ? 'COA-2010' : 'COA-2020';
        $amount = (float) $invoice->amount_etb;

        return DB::transaction(function () use ($invoice, $validated, $bankAccount, $payableAccount, $amount) {
            $invoice->update([
                'status' => 'paid',
                'payment_date' => now()->toDateString(),
                'payment_ref' => $validated['payment_ref'],
            ]);

            // Post cash outflow and clear the payable.
            $this->postEntry([
                'date' => now()->toDateString(),
                'description' => "Supplier payment - {$invoice->supplier_name} ({$invoice->invoice_no})",
                'source_module' => 'Banking',
                'reference' => $validated['payment_ref'],
                'created_by' => 'System',
                'approved_by' => 'Finance Manager',
            ], [
                ['account_id' => $payableAccount, 'debit' => $amount, 'credit' => 0, 'description' => "Clear AP - {$invoice->supplier_name}"],
                ['account_id' => $bankAccount, 'debit' => 0, 'credit' => $amount, 'description' => 'Bank payment'],
            ]);

            $this->recordBankTransaction($bankAccount, 'debit', $amount, "Payment to {$invoice->supplier_name}", $validated['payment_ref']);

            return response()->json(['success' => true, 'data' => $invoice->fresh()]);
        });
    }

    // ─── Steps 2 & 5: Accounts Receivable & Collections ─────────

    public function storeArInvoice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|string|max:100',
            'customer_name' => 'required|string|max:255',
            'invoice_no' => 'required|string|max:100',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'currency' => 'sometimes|string|max:10',
            'amount' => 'required|numeric|min:0.01',
            'vat_amount' => 'sometimes|numeric|min:0',
        ]);

        $validated['id'] = $this->nextId('ARI-' . now()->year . '-', ArInvoice::class);
        $validated['vat_amount'] = $validated['vat_amount'] ?? round($validated['amount'] * 0.15, 2);
        $validated['total_amount'] = $validated['amount'] + $validated['vat_amount'];
        $validated['status'] = 'sent';

        $invoice = ArInvoice::create($validated);

        // Automated posting (Step 2): debit AR, credit Revenue + Output VAT.
        $this->postEntry([
            'date' => $validated['invoice_date'],
            'description' => "Sales invoice {$invoice->invoice_no} - {$invoice->customer_name}",
            'source_module' => 'Sales',
            'reference' => $invoice->invoice_no,
            'created_by' => 'System',
            'approved_by' => 'Auto-approved',
            'currency' => $invoice->currency,
        ], [
            ['account_id' => 'COA-1110', 'debit' => (float) $invoice->total_amount, 'credit' => 0, 'description' => "AR - {$invoice->customer_name}"],
            ['account_id' => 'COA-4010', 'debit' => 0, 'credit' => (float) $invoice->amount, 'description' => 'Sales revenue (excl VAT)'],
            ['account_id' => 'COA-2110', 'debit' => 0, 'credit' => (float) $invoice->vat_amount, 'description' => 'Output VAT 15%'],
        ]);

        return response()->json(['success' => true, 'data' => $invoice], 201);
    }

    public function recordArPayment(Request $request, string $id): JsonResponse
    {
        $invoice = ArInvoice::findOrFail($id);

        if (in_array($invoice->status, ['paid', 'written_off'], true)) {
            return response()->json(['success' => false, 'message' => 'Invoice is already settled.'], 422);
        }

        $validated = $request->validate([
            'payment_ref' => 'required|string|max:100',
            'bank_account_id' => 'sometimes|string|exists:chart_of_accounts,id',
        ]);

        $bankAccount = $validated['bank_account_id'] ?? 'COA-1020';
        $amount = (float) $invoice->total_amount;

        return DB::transaction(function () use ($invoice, $validated, $bankAccount, $amount) {
            $invoice->update([
                'status' => 'paid',
                'payment_date' => now()->toDateString(),
                'payment_ref' => $validated['payment_ref'],
            ]);

            $this->postEntry([
                'date' => now()->toDateString(),
                'description' => "Customer payment received - {$invoice->customer_name}",
                'source_module' => 'Banking',
                'reference' => $validated['payment_ref'],
                'created_by' => 'System',
                'approved_by' => 'Auto-approved',
            ], [
                ['account_id' => $bankAccount, 'debit' => $amount, 'credit' => 0, 'description' => 'Bank deposit received'],
                ['account_id' => 'COA-1110', 'debit' => 0, 'credit' => $amount, 'description' => "Clear AR - {$invoice->customer_name}"],
            ]);

            $this->recordBankTransaction($bankAccount, 'credit', $amount, "Customer payment - {$invoice->customer_name}", $validated['payment_ref']);

            return response()->json(['success' => true, 'data' => $invoice->fresh()]);
        });
    }

    // ─── Step 6: Bank Reconciliation ────────────────────────────

    private function recordBankTransaction(string $bankAccountId, string $type, float $amount, string $description, string $reference): BankTransaction
    {
        $lastBalance = (float) (BankTransaction::where('bank_account_id', $bankAccountId)
            ->orderByDesc('date')->orderByDesc('created_at')->value('balance_after') ?? 0);

        return BankTransaction::create([
            'id' => $this->nextId('BT-' . now()->year . '-', BankTransaction::class),
            'bank_account_id' => $bankAccountId,
            'date' => now()->toDateString(),
            'description' => $description,
            'type' => $type,
            'amount' => $amount,
            'balance_after' => $type === 'credit' ? $lastBalance + $amount : $lastBalance - $amount,
            'reference' => $reference,
            'reconciled' => false,
        ]);
    }

    public function storeBankTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|string|exists:chart_of_accounts,id',
            'date' => 'required|date',
            'description' => 'required|string|max:500',
            'type' => 'required|string|in:debit,credit',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:100',
        ]);

        $txn = $this->recordBankTransaction(
            $validated['bank_account_id'],
            $validated['type'],
            (float) $validated['amount'],
            $validated['description'],
            $validated['reference'] ?? ''
        );
        $txn->update(['date' => $validated['date']]);

        return response()->json(['success' => true, 'data' => $txn->fresh()], 201);
    }

    public function reconcileBankTransaction(string $id): JsonResponse
    {
        $txn = BankTransaction::findOrFail($id);

        if ($txn->reconciled) {
            return response()->json(['success' => false, 'message' => 'Transaction is already reconciled.'], 422);
        }

        $txn->update(['reconciled' => true, 'reconciled_date' => now()->toDateString()]);

        return response()->json(['success' => true, 'data' => $txn->fresh()]);
    }

    // ─── Step 7: Budgets ────────────────────────────────────────

    public function storeBudget(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cost_center' => 'required|string|max:100',
            'account_id' => 'required|string|exists:chart_of_accounts,id',
            'category' => 'required|string|max:255',
            'period' => 'required|string|max:20',
            'budget_amount' => 'required|numeric|min:0',
        ]);

        $validated['id'] = $this->nextId('BUD-' . now()->year . '-', Budget::class);
        $validated['actual_amount'] = 0;

        $budget = Budget::create($validated);

        return response()->json(['success' => true, 'data' => $budget], 201);
    }

    // ─── Step 8: Fixed Assets & Depreciation ────────────────────

    public function storeFixedAsset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_code' => 'required|string|unique:fixed_assets,asset_code',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'account_id' => 'required|string|exists:chart_of_accounts,id',
            'acquisition_date' => 'required|date',
            'acquisition_cost' => 'required|numeric|min:0.01',
            'useful_life_years' => 'required|integer|min:1',
            'depreciation_method' => 'sometimes|string|max:50',
            'salvage_value' => 'sometimes|numeric|min:0',
            'location' => 'nullable|string|max:255',
        ]);

        $validated['id'] = $this->nextId('FA-', FixedAsset::class);
        $validated['status'] = 'active';

        $asset = FixedAsset::create($validated);

        return response()->json(['success' => true, 'data' => $asset], 201);
    }

    /**
     * Posts one month of depreciation for every active asset, honouring the
     * asset's method: Straight Line or Declining Balance (double-declining).
     */
    public function postMonthlyDepreciation(): array
    {
        $assets = FixedAsset::where('status', 'active')->get();
        $totalPosted = 0.0;
        $count = 0;

        foreach ($assets as $asset) {
            $depreciable = (float) $asset->acquisition_cost - (float) $asset->salvage_value;

            if ($asset->depreciation_method === 'Declining Balance' && $asset->useful_life_years > 0) {
                // Period Depreciation = NBV(start) × (1 / life × acceleration factor) / 12
                $rate = (1 / $asset->useful_life_years) * 2; // double-declining
                $nbv = (float) $asset->acquisition_cost - (float) $asset->accumulated_depreciation;
                $monthly = round($nbv * $rate / 12, 2);
            } else {
                // Straight line: (cost − salvage) / life / 12
                $annual = $asset->useful_life_years > 0 ? $depreciable / $asset->useful_life_years : 0;
                $monthly = round($annual / 12, 2);
            }

            if ($monthly <= 0 || (float) $asset->accumulated_depreciation >= $depreciable) {
                if ((float) $asset->accumulated_depreciation >= $depreciable && $asset->status === 'active') {
                    $asset->update(['status' => 'fully_depreciated']);
                }
                continue;
            }

            // Never depreciate below salvage value.
            $monthly = min($monthly, $depreciable - (float) $asset->accumulated_depreciation);
            $asset->increment('accumulated_depreciation', $monthly);
            $totalPosted += $monthly;
            $count++;
        }

        if ($totalPosted > 0) {
            $this->postEntry([
                'date' => now()->toDateString(),
                'description' => now()->format('F Y') . ' depreciation posting - all fixed assets',
                'source_module' => 'Fixed Assets',
                'reference' => 'DEPR-' . now()->format('Y-m'),
                'created_by' => 'System',
                'approved_by' => 'Auto-approved',
            ], [
                ['account_id' => 'COA-6080', 'debit' => round($totalPosted, 2), 'credit' => 0, 'description' => 'Monthly depreciation expense'],
                ['account_id' => 'COA-1340', 'debit' => 0, 'credit' => round($totalPosted, 2), 'description' => 'Accumulated depreciation'],
            ]);
        }

        return ['assets' => $count, 'amount' => round($totalPosted, 2)];
    }

    // ─── Step 9: Period-End Close ───────────────────────────────

    private function closedPeriods(): array
    {
        return Cache::get('finance:closed-periods', []);
    }

    public function closePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate(['period' => 'required|string|regex:/^\d{4}-\d{2}$/']);
        $period = $validated['period'];

        // Step 9 checklist gate: the period locks only when every item passes.
        $depreciationPosted = JournalEntry::where('reference', 'DEPR-' . $period)
            ->where('status', 'posted')->exists()
            || !FixedAsset::where('status', 'active')->exists();

        $unreconciled = BankTransaction::where('reconciled', false)
            ->whereBetween('date', [$period . '-01', date('Y-m-t', strtotime($period . '-01'))])
            ->count();

        $draftEntries = JournalEntry::where('status', 'draft')
            ->where('date', 'like', $period . '%')->count();

        $checklist = [
            'depreciation_posted' => $depreciationPosted,
            'sub_ledgers_reconciled' => $unreconciled === 0,
            'accruals_recorded' => $draftEntries === 0,
        ];

        if (in_array(false, $checklist, true)) {
            $failures = [];
            if (!$depreciationPosted) {
                $failures[] = "depreciation for {$period} has not been posted";
            }
            if ($unreconciled > 0) {
                $failures[] = "{$unreconciled} bank transaction(s) in {$period} are unreconciled";
            }
            if ($draftEntries > 0) {
                $failures[] = "{$draftEntries} journal entr(ies) in {$period} are still draft";
            }
            return response()->json([
                'success' => false,
                'message' => 'Period cannot be closed: ' . implode('; ', $failures) . '.',
                'data' => ['checklist' => $checklist],
            ], 422);
        }

        $periods = $this->closedPeriods();
        if (!in_array($period, $periods, true)) {
            $periods[] = $period;
            Cache::forever('finance:closed-periods', $periods);
        }

        Log::info('Finance period closed', ['period' => $period, 'by' => $request->user()?->name, 'checklist' => $checklist]);

        return response()->json(['success' => true, 'data' => ['closed_periods' => $periods, 'checklist' => $checklist]]);
    }

    public function reopenPeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|regex:/^\d{4}-\d{2}$/',
            'justification' => 'required|string|max:1000',
        ]);

        $periods = array_values(array_diff($this->closedPeriods(), [$validated['period']]));
        Cache::forever('finance:closed-periods', $periods);

        // Reopening requires a logged justification (Step 9).
        Log::warning('Finance period reopened', [
            'period' => $validated['period'],
            'by' => $request->user()?->name,
            'justification' => $validated['justification'],
        ]);

        return response()->json(['success' => true, 'data' => ['closed_periods' => $periods]]);
    }

    // ─── Step 10: Financial Statements ──────────────────────────

    public function statements(Request $request): JsonResponse
    {
        $asOf = $request->get('as_of', now()->toDateString());

        $lines = JournalLine::query()
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('chart_of_accounts', 'chart_of_accounts.id', '=', 'journal_lines.account_id')
            ->where('journal_entries.status', 'posted')
            ->where('journal_entries.date', '<=', $asOf)
            ->select(
                'chart_of_accounts.id as account_id',
                'chart_of_accounts.name as account_name',
                'chart_of_accounts.type as account_type',
                DB::raw('SUM(journal_lines.debit) as total_debit'),
                DB::raw('SUM(journal_lines.credit) as total_credit')
            )
            ->groupBy('chart_of_accounts.id', 'chart_of_accounts.name', 'chart_of_accounts.type')
            ->get();

        $byType = fn (string $type) => $lines->where('account_type', $type);

        // Income Statement: Revenue (credit-normal) minus Expenses (debit-normal).
        $revenue = $byType('Revenue')->sum(fn ($l) => (float) $l->total_credit - (float) $l->total_debit);
        $expenses = $byType('Expense')->sum(fn ($l) => (float) $l->total_debit - (float) $l->total_credit);
        $netIncome = $revenue - $expenses;

        // Balance Sheet.
        $assets = $byType('Asset')->sum(fn ($l) => (float) $l->total_debit - (float) $l->total_credit);
        $liabilities = $byType('Liability')->sum(fn ($l) => (float) $l->total_credit - (float) $l->total_debit);
        $equity = $byType('Equity')->sum(fn ($l) => (float) $l->total_credit - (float) $l->total_debit);

        // Cash Flow: direct (from bank transactions) plus indirect operating CF.
        $inflows = (float) BankTransaction::where('type', 'credit')->where('date', '<=', $asOf)->sum('amount');
        $outflows = (float) BankTransaction::where('type', 'debit')->where('date', '<=', $asOf)->sum('amount');
        $depreciation = (float) JournalLine::where('account_id', 'COA-6080')
            ->whereHas('entry', fn ($q) => $q->where('status', 'posted')->where('date', '<=', $asOf))
            ->sum('debit');

        // Step 5: DSO and invoice aging buckets.
        $openAr = ArInvoice::whereNotIn('status', ['paid', 'written_off'])->get();
        $creditSales = (float) ArInvoice::sum('total_amount');
        $avgAr = (float) $openAr->sum('total_amount');
        $dso = $creditSales > 0 ? round($avgAr / $creditSales * 365, 1) : 0;
        $aging = ['current' => 0.0, '0-30' => 0.0, '31-60' => 0.0, '61-90' => 0.0, '90+' => 0.0];
        foreach ($openAr as $inv) {
            $overdue = $inv->due_date->isPast() ? (int) $inv->due_date->diffInDays(now()) : -1;
            $bucket = $overdue < 0 ? 'current' : ($overdue <= 30 ? '0-30' : ($overdue <= 60 ? '31-60' : ($overdue <= 90 ? '61-90' : '90+')));
            $aging[$bucket] += (float) $inv->total_amount;
        }

        // Step 4: DPO = (Average AP / COGS) × days.
        $openAp = (float) ApInvoice::whereNotIn('status', ['paid'])->sum('amount_etb');
        $cogs = (float) JournalLine::whereIn('account_id', ['COA-5010', 'COA-5020', 'COA-5030', 'COA-5040'])
            ->whereHas('entry', fn ($q) => $q->where('status', 'posted')->where('date', '<=', $asOf))
            ->sum('debit');
        $dpo = $cogs > 0 ? round($openAp / $cogs * 365, 1) : 0;

        // Step 6: bank statement balance vs system book balance.
        $bankBalance = 0.0;
        foreach (BankTransaction::select('bank_account_id')->distinct()->pluck('bank_account_id') as $acct) {
            $bankBalance += (float) (BankTransaction::where('bank_account_id', $acct)
                ->orderByDesc('date')->orderByDesc('created_at')->value('balance_after') ?? 0);
        }
        $bookBalance = (float) JournalLine::whereIn('account_id', BankTransaction::select('bank_account_id')->distinct()->pluck('bank_account_id'))
            ->whereHas('entry', fn ($q) => $q->where('status', 'posted'))
            ->selectRaw('COALESCE(SUM(debit - credit), 0) as bal')->value('bal');
        $unmatchedItems = BankTransaction::where('reconciled', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'as_of' => $asOf,
                'income_statement' => [
                    'revenue' => round($revenue, 2),
                    'expenses' => round($expenses, 2),
                    'net_income' => round($netIncome, 2),
                    'detail' => $lines->whereIn('account_type', ['Revenue', 'Expense'])->values(),
                ],
                'balance_sheet' => [
                    'assets' => round($assets, 2),
                    'liabilities' => round($liabilities, 2),
                    'equity' => round($equity + $netIncome, 2),
                    'balanced' => abs($assets - ($liabilities + $equity + $netIncome)) < 1,
                    'detail' => $lines->whereIn('account_type', ['Asset', 'Liability', 'Equity'])->values(),
                ],
                'cash_flow' => [
                    'inflows' => round($inflows, 2),
                    'outflows' => round($outflows, 2),
                    'net_cash_flow' => round($inflows - $outflows, 2),
                    'operating_cf_indirect' => round($netIncome + $depreciation, 2),
                    'depreciation_addback' => round($depreciation, 2),
                ],
                'receivables' => [
                    'dso_days' => $dso,
                    'open_balance' => round($avgAr, 2),
                    'aging_buckets' => array_map(fn ($v) => round($v, 2), $aging),
                ],
                'payables' => [
                    'dpo_days' => $dpo,
                    'open_balance' => round($openAp, 2),
                ],
                'bank_reconciliation' => [
                    'bank_statement_balance' => round($bankBalance, 2),
                    'system_book_balance' => round($bookBalance, 2),
                    'variance' => round($bankBalance - $bookBalance, 2),
                    'reconciled' => abs($bankBalance - $bookBalance) < 1,
                    'unmatched_items' => $unmatchedItems,
                ],
                'tax_summary' => TaxRecord::orderBy('period')->get(),
            ],
        ]);
    }
}
