<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditObserver
{
    /**
     * Models that should not be audited
     */
    protected array $excludedModels = [
        'App\Models\AuditLog',
        'App\Models\LoginActivity',
        'App\Models\PersonalAccessToken',
    ];

    /**
     * Attributes that should not be logged in the audit trail
     */
    protected array $hiddenAttributes = [
        'password',
        'remember_token',
        'secret',
        'recovery_codes',
        'two_factor_secret',
    ];

    /**
     * Complete map of all 27 ERP modules.
     * Models are mapped to their respective modules.
     * Any model not listed defaults to its detected or custom module.
     */
    protected array $moduleMap = [
        // Module 1: User Management
        'User' => 'User Management',
        'Role' => 'User Management',
        'Permission' => 'User Management',

        // Module 2: Security
        'TwoFactorSecret' => 'Security',

        // Module 3: System Administration
        // (no model yet)

        // Module 4: Human Resources
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
    ];

    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'create', null, $this->getAuditableAttributes($model));
        }
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $original = $this->getAuditableAttributes($model->getOriginal());
            $changes = $this->getAuditableAttributes($model->getChanges());

            // Only log if there are actual changes
            if (!empty($changes)) {
                $this->logAudit($model, 'update', $original, $changes);
            }
        }
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'delete', $this->getAuditableAttributes($model->getAttributes()), null);
        }
    }

    /**
     * Handle the model "restored" event (for soft deletes).
     */
    public function restored(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'restore', null, $this->getAuditableAttributes($model));
        }
    }

    /**
     * Handle the model "force deleted" event.
     */
    public function forceDeleted(Model $model): void
    {
        if ($this->shouldAudit($model)) {
            $this->logAudit($model, 'force_delete', $this->getAuditableAttributes($model->getAttributes()), null);
        }
    }

    /**
     * Log an approve action (called manually from controllers/services).
     */
    public static function logApprove(Model $model, ?array $oldValues = null, ?array $newValues = null): void
    {
        $observer = new self();
        if (!$observer->shouldAudit($model)) {
            return;
        }

        $observer->logAudit($model, 'approve', $oldValues, $newValues);
    }

    /**
     * Log a custom action (called manually from controllers/services).
     */
    public static function logCustom(Model $model, string $action, ?array $oldValues = null, ?array $newValues = null): void
    {
        $observer = new self();
        if (!$observer->shouldAudit($model)) {
            return;
        }

        $observer->logAudit($model, $action, $oldValues, $newValues);
    }

    /**
     * Determine if the model should be audited
     */
    protected function shouldAudit(Model $model): bool
    {
        $modelClass = get_class($model);

        // Don't audit excluded models
        if (in_array($modelClass, $this->excludedModels)) {
            return false;
        }

        // Check if model has auditing disabled
        if (property_exists($model, 'auditEnabled') && !$model->auditEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Log the audit trail
     */
    protected function logAudit(Model $model, string $action, ?array $oldValues, ?array $newValues): void
    {
        try {
            $user = Auth::user();
            $request = request();

            AuditLog::create([
                'user_id' => $user?->id,
                'user_email' => $user?->email ?? 'system',
                'full_name' => $user?->full_name ?? 'System',
                'action' => $action,
                'module' => $this->getModuleName($model),
                'model_type' => get_class($model),
                'model_id' => $model->getKey(),
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the application flow
            \Log::error('Audit logging failed: ' . $e->getMessage(), [
                'model' => get_class($model),
                'action' => $action,
                'model_id' => $model->getKey(),
            ]);
        }
    }

    /**
     * Get the module name from the model.
     *
     * Resolution order:
     * 1. Model's $auditModule property (custom override)
     * 2. Model's $auditModuleName property (alternative override)
     * 3. Static $moduleMap lookup by class basename
     * 4. 'General' fallback
     */
    protected function getModuleName(Model $model): string
    {
        // Check if model has a custom module name property
        if (property_exists($model, 'auditModule')) {
            return $model->auditModule;
        }

        if (property_exists($model, 'auditModuleName')) {
            return $model->auditModuleName;
        }

        // Extract module name from model class name
        $className = class_basename($model);

        return $this->moduleMap[$className] ?? 'General';
    }

    /**
     * Filter attributes to include only auditable ones
     */
    protected function getAuditableAttributes(array|Model $data): array
    {
        if ($data instanceof Model) {
            $data = $data->getAttributes();
        }

        // Remove hidden attributes
        foreach ($this->hiddenAttributes as $hidden) {
            unset($data[$hidden]);
        }

        return $data;
    }
}
