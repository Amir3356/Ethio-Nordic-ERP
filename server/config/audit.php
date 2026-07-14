<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Excluded Models
    |--------------------------------------------------------------------------
    |
    | Models listed here will not be audited. Use fully qualified class names.
    |
    */

    'excluded_models' => [
        'App\Models\AuditLog',
        'App\Models\LoginActivity',
        'App\Models\PersonalAccessToken',
        'App\Models\RefreshToken',
        'App\Models\TwoFactorSecret',
    ],

    /*
    |--------------------------------------------------------------------------
    | Hidden Attributes
    |--------------------------------------------------------------------------
    |
    | Sensitive attributes that should never appear in audit logs.
    |
    */

    'hidden_attributes' => [
        'password',
        'remember_token',
        'secret',
        'recovery_codes',
        'two_factor_secret',
        'token',
    ],

    /*
    |--------------------------------------------------------------------------
    | Ignored Update-Only Fields
    |--------------------------------------------------------------------------
    |
    | For the given model, if an "updated" event only changes fields in this
    | list (plus the model's own "updated_at" timestamp), the update is
    | considered authentication noise and is not recorded in the audit trail.
    |
    */

    'ignored_update_fields' => [
        'App\Models\User' => ['last_login_at'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Map
    |--------------------------------------------------------------------------
    |
    | Maps model class names (without namespace) to their ERP module.
    |
    */

    'module_map' => [
        // User Management
        'User' => 'User Management',
        'Role' => 'User Management',
        'Permission' => 'User Management',

        // Security
        'TwoFactorSecret' => 'Security',
        'RefreshToken' => 'Security',

        // Human Resources
        'Employee' => 'Human Resources',
        'LeaveRequest' => 'Human Resources',
        'AttendanceLog' => 'Human Resources',
        'EmployeeDocument' => 'Human Resources',
        'PerformanceReview' => 'Human Resources',
        'Training' => 'Human Resources',
        'PayrollRun' => 'Human Resources',
        'Payslip' => 'Human Resources',

        // Finance & Accounting
        'ChartOfAccount' => 'Finance & Accounting',
        'JournalEntry' => 'Finance & Accounting',
        'JournalLine' => 'Finance & Accounting',
        'ApInvoice' => 'Finance & Accounting',
        'ArInvoice' => 'Finance & Accounting',
        'BankTransaction' => 'Finance & Accounting',
        'Budget' => 'Finance & Accounting',
        'FixedAsset' => 'Finance & Accounting',
        'TaxRecord' => 'Finance & Accounting',

        // Inventory Management
        'Product' => 'Inventory Management',
        'StockBatch' => 'Inventory Management',
        'StockAdjustment' => 'Inventory Management',
        'StockLedger' => 'Inventory Management',
        'DamagedGood' => 'Inventory Management',
        'ReorderRule' => 'Inventory Management',
        'Warehouse' => 'Inventory Management',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Module
    |--------------------------------------------------------------------------
    |
    | The fallback module name when a model is not found in the module map.
    |
    */

    'default_module' => 'General',

];
