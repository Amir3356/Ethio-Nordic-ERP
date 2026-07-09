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
        // Module 1: User Management
        'User' => 'User Management',
        'Role' => 'User Management',
        'Permission' => 'User Management',

        // Module 2: Security
        'TwoFactorSecret' => 'Security',

        // Module 3: Human Resources
        'Employee' => 'Human Resources',
        'Department' => 'Human Resources',
        'Designation' => 'Human Resources',
        'LeaveRequest' => 'Human Resources',
        'Attendance' => 'Human Resources',
        'EmployeeDocument' => 'Human Resources',

        // Module 5: Finance & Accounting
        'Account' => 'Finance & Accounting',
        'JournalEntry' => 'Finance & Accounting',
        'GeneralLedger' => 'Finance & Accounting',
        'ChartOfAccounts' => 'Finance & Accounting',
        'FiscalPeriod' => 'Finance & Accounting',
        'FinancialReport' => 'Finance & Accounting',

        // Module 6: Procurement
        'PurchaseRequisition' => 'Procurement',
        'RequestForQuotation' => 'Procurement',
        'Quotation' => 'Procurement',
        'PurchaseOrder' => 'Procurement',

        // Module 7: Inventory Management
        'Product' => 'Inventory Management',
        'ProductCategory' => 'Inventory Management',
        'StockMovement' => 'Inventory Management',
        'InventoryAdjustment' => 'Inventory Management',
        'Batch' => 'Inventory Management',

        // Module 8: Sales & CRM
        'Customer' => 'Sales & CRM',
        'SalesOrder' => 'Sales & CRM',
        'QuotationRequest' => 'Sales & CRM',
        'SalesInvoice' => 'Sales & CRM',
        'SalesReturn' => 'Sales & CRM',
        'Lead' => 'Sales & CRM',

        // Module 9: Purchase Management
        'Supplier' => 'Purchase Management',
        'PurchaseInvoice' => 'Purchase Management',
        'PurchaseReturn' => 'Purchase Management',
        'GoodsReceived' => 'Purchase Management',

        // Module 10: Warehouse Management
        'Warehouse' => 'Warehouse Management',
        'StorageLocation' => 'Warehouse Management',
        'WarehouseTransfer' => 'Warehouse Management',
        'WarehouseStaff' => 'Warehouse Management',

        // Module 11: Manufacturing
        'BillOfMaterials' => 'Manufacturing',
        'WorkOrder' => 'Manufacturing',
        'ProductionPlan' => 'Manufacturing',
        'ManufacturingProcess' => 'Manufacturing',

        // Module 12: Project Management
        'Project' => 'Project Management',
        'Task' => 'Project Management',
        'Milestone' => 'Project Management',
        'ProjectBudget' => 'Project Management',

        // Module 13: Document Management
        'Document' => 'Document Management',
        'DocumentCategory' => 'Document Management',
        'DocumentVersion' => 'Document Management',
        'DocumentApproval' => 'Document Management',

        // Module 14: Reporting & Analytics
        'Report' => 'Reporting & Analytics',
        'Dashboard' => 'Reporting & Analytics',
        'ScheduledReport' => 'Reporting & Analytics',

        // Module 15: Notification & Communication
        'Notification' => 'Notification & Communication',
        'EmailTemplate' => 'Notification & Communication',
        'SmsLog' => 'Notification & Communication',
        'Announcement' => 'Notification & Communication',

        // Module 16: Organization & Settings
        'Company' => 'Organization & Settings',
        'Branch' => 'Organization & Settings',
        'SystemSetting' => 'Organization & Settings',
        'Configuration' => 'Organization & Settings',

        // Module 17: Audit & Compliance
        'ComplianceCheck' => 'Audit & Compliance',
        'RegulatorySubmission' => 'Audit & Compliance',
        'AuditTrail' => 'Audit & Compliance',

        // Module 18: Tax Management
        'TaxRate' => 'Tax Management',
        'TaxReturn' => 'Tax Management',
        'TaxExemption' => 'Tax Management',

        // Module 19: Banking & Payments
        'BankAccount' => 'Banking & Payments',
        'Payment' => 'Banking & Payments',
        'PaymentMethod' => 'Banking & Payments',
        'BankReconciliation' => 'Banking & Payments',

        // Module 20: Fixed Assets
        'FixedAsset' => 'Fixed Assets',
        'AssetCategory' => 'Fixed Assets',
        'Depreciation' => 'Fixed Assets',
        'AssetTransfer' => 'Fixed Assets',

        // Module 21: Payroll
        'Payroll' => 'Payroll',
        'PayrollItem' => 'Payroll',
        'SalaryComponent' => 'Payroll',
        'PayrollRun' => 'Payroll',

        // Module 22: Employee Self-Service
        'LeaveBalance' => 'Employee Self-Service',
        'ExpenseClaim' => 'Employee Self-Service',
        'Payslip' => 'Employee Self-Service',

        // Module 23: Customer Management
        'CustomerContact' => 'Customer Management',
        'CustomerGroup' => 'Customer Management',
        'CustomerAddress' => 'Customer Management',

        // Module 24: Vendor/Supplier Management
        'VendorContact' => 'Vendor/Supplier Management',
        'VendorGroup' => 'Vendor/Supplier Management',
        'VendorPerformance' => 'Vendor/Supplier Management',

        // Module 25: Quality Control
        'QualityInspection' => 'Quality Control',
        'QualityStandard' => 'Quality Control',
        'NonConformance' => 'Quality Control',

        // Module 26: Logistics & Shipping
        'Shipment' => 'Logistics & Shipping',
        'DeliveryNote' => 'Logistics & Shipping',
        'Carrier' => 'Logistics & Shipping',
        'ShippingMethod' => 'Logistics & Shipping',

        // Module 27: Integration & API
        'ApiEndpoint' => 'Integration & API',
        'Webhook' => 'Integration & API',
        'IntegrationLog' => 'Integration & API',
        'ExternalService' => 'Integration & API',

        // Refresh tokens
        'RefreshToken' => 'Security',
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
