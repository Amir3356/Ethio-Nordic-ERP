<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    use \App\Traits\Auditable;

    protected $primaryKey = 'payslip_id';

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'base_salary',
        'overtime_pay',
        'allowances',
        'bonus',
        'gross_salary',
        'income_tax',
        'pension_employee',
        'pension_employer',
        'other_deductions',
        'net_salary',
        'status',
        'payslip_generated',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'overtime_pay' => 'decimal:2',
            'allowances' => 'decimal:2',
            'bonus' => 'decimal:2',
            'gross_salary' => 'decimal:2',
            'income_tax' => 'decimal:2',
            'pension_employee' => 'decimal:2',
            'pension_employer' => 'decimal:2',
            'other_deductions' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'payslip_generated' => 'boolean',
        ];
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id', 'payroll_run_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}
