<?php

use App\Http\Controllers\Api\FinanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    Route::prefix('finance')->group(function () {
        Route::get('/', [FinanceController::class, 'overview']);

        // Step 1: Chart of Accounts
        Route::post('/accounts', [FinanceController::class, 'storeAccount']);
        Route::put('/accounts/{id}', [FinanceController::class, 'updateAccount']);

        // Step 3: Manual Journal Entries (balance-validated, threshold approval)
        Route::post('/journal-entries', [FinanceController::class, 'storeJournalEntry']);
        Route::post('/journal-entries/{id}/approve', [FinanceController::class, 'approveJournalEntry']);

        // Step 4: Accounts Payable (three-way match)
        Route::post('/ap-invoices', [FinanceController::class, 'storeApInvoice']);
        Route::post('/ap-invoices/{id}/approve', [FinanceController::class, 'approveApInvoice']);
        Route::post('/ap-invoices/{id}/pay', [FinanceController::class, 'payApInvoice']);

        // Steps 2 & 5: Accounts Receivable & Collections
        Route::post('/ar-invoices', [FinanceController::class, 'storeArInvoice']);
        Route::post('/ar-invoices/{id}/record-payment', [FinanceController::class, 'recordArPayment']);

        // Step 6: Bank Reconciliation
        Route::post('/bank-transactions', [FinanceController::class, 'storeBankTransaction']);
        Route::post('/bank-transactions/{id}/reconcile', [FinanceController::class, 'reconcileBankTransaction']);

        // Step 7: Budgets
        Route::post('/budgets', [FinanceController::class, 'storeBudget']);

        // Step 8: Fixed Assets
        Route::post('/fixed-assets', [FinanceController::class, 'storeFixedAsset']);

        // Step 9: Period-End Close
        Route::post('/periods/close', [FinanceController::class, 'closePeriod']);
        Route::post('/periods/reopen', [FinanceController::class, 'reopenPeriod']);

        // Step 10: Financial Statements
        Route::get('/statements', [FinanceController::class, 'statements']);
    });
});
