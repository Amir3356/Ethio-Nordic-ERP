<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module 3 (Finance & Accounting) — the 9 core entities.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('type'); // Asset | Liability | Equity | Revenue | Expense
            $table->string('parent_id')->nullable()->index();
            $table->string('currency', 10)->default('ETB');
            $table->string('cost_center')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->date('date')->index();
            $table->text('description');
            $table->string('source_module')->index();
            $table->string('reference');
            $table->string('status')->default('draft'); // draft | posted | reversed
            $table->string('created_by')->nullable();
            $table->string('approved_by')->nullable();
            $table->decimal('total_debit', 18, 2)->default(0);
            $table->decimal('total_credit', 18, 2)->default(0);
            $table->string('currency', 10)->default('ETB');
            $table->decimal('exchange_rate', 12, 4)->default(1);
            $table->timestamps();
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('journal_entry_id')->index();
            $table->string('account_id')->index();
            $table->decimal('debit', 18, 2)->default(0);
            $table->decimal('credit', 18, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('chart_of_accounts');
        });

        Schema::create('ap_invoices', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('supplier_id');
            $table->string('supplier_name');
            $table->string('invoice_no');
            $table->string('po_ref')->nullable();
            $table->string('grn_ref')->nullable();
            $table->date('invoice_date');
            $table->date('due_date');
            $table->string('currency', 10)->default('ETB');
            $table->decimal('amount', 18, 2);
            $table->decimal('amount_etb', 18, 2);
            $table->decimal('vat_amount', 18, 2)->default(0);
            $table->string('status')->default('draft')->index();
            $table->date('payment_date')->nullable();
            $table->string('payment_ref')->nullable();
            $table->boolean('matched_po')->default(false);
            $table->boolean('matched_grn')->default(false);
            $table->timestamps();
        });

        Schema::create('ar_invoices', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('customer_id');
            $table->string('customer_name');
            $table->string('invoice_no');
            $table->date('invoice_date');
            $table->date('due_date');
            $table->string('currency', 10)->default('ETB');
            $table->decimal('amount', 18, 2);
            $table->decimal('vat_amount', 18, 2)->default(0);
            $table->decimal('total_amount', 18, 2);
            $table->string('status')->default('draft')->index();
            $table->date('payment_date')->nullable();
            $table->string('payment_ref')->nullable();
            $table->timestamps();
        });

        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('bank_account_id')->index();
            $table->date('date')->index();
            $table->text('description');
            $table->string('type'); // debit | credit
            $table->decimal('amount', 18, 2);
            $table->decimal('balance_after', 18, 2)->default(0);
            $table->string('reference')->nullable();
            $table->boolean('reconciled')->default(false);
            $table->date('reconciled_date')->nullable();
            $table->timestamps();

            $table->foreign('bank_account_id')->references('id')->on('chart_of_accounts');
        });

        Schema::create('budgets', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('cost_center')->index();
            $table->string('account_id')->index();
            $table->string('category');
            $table->string('period')->index();
            $table->decimal('budget_amount', 18, 2);
            $table->decimal('actual_amount', 18, 2)->default(0);
            $table->timestamps();

            $table->foreign('account_id')->references('id')->on('chart_of_accounts');
            $table->unique(['cost_center', 'account_id', 'period']);
        });

        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('asset_code')->unique();
            $table->string('name');
            $table->string('category');
            $table->string('account_id');
            $table->date('acquisition_date');
            $table->decimal('acquisition_cost', 18, 2);
            $table->unsignedInteger('useful_life_years');
            $table->string('depreciation_method')->default('Straight Line');
            $table->decimal('salvage_value', 18, 2)->default(0);
            $table->decimal('accumulated_depreciation', 18, 2)->default(0);
            $table->string('status')->default('active')->index();
            $table->string('location')->nullable();
            $table->timestamps();

            $table->foreign('account_id')->references('id')->on('chart_of_accounts');
        });

        Schema::create('tax_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('tax_type')->index();
            $table->string('period')->index();
            $table->date('filing_date')->nullable();
            $table->decimal('output_vat', 18, 2)->nullable();
            $table->decimal('input_vat', 18, 2)->nullable();
            $table->decimal('net_vat_payable', 18, 2)->nullable();
            $table->decimal('wht_collected', 18, 2)->nullable();
            $table->decimal('wht_paid', 18, 2)->nullable();
            $table->decimal('taxable_income', 18, 2)->nullable();
            $table->decimal('tax_rate', 8, 2)->nullable();
            $table->decimal('tax_amount', 18, 2)->nullable();
            $table->string('status')->default('pending')->index();
            $table->date('payment_date')->nullable();
            $table->string('payment_ref')->nullable();
            $table->string('account_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_records');
        Schema::dropIfExists('fixed_assets');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('bank_transactions');
        Schema::dropIfExists('ar_invoices');
        Schema::dropIfExists('ap_invoices');
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('chart_of_accounts');
    }
};
