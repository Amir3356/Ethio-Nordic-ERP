<?php

namespace App\Services\Audit;

use Illuminate\Database\Eloquent\Model;

class AuditModuleResolver
{
    protected array $moduleMap;
    protected string $defaultModule;

    public function __construct()
    {
        $this->moduleMap = config('audit.module_map', []);
        $this->defaultModule = config('audit.default_module', 'General');
    }

    /**
     * Resolve the ERP module for a given model.
     *
     * Resolution order:
     * 1. Model's $auditModule property (custom override)
     * 2. Model's $auditModuleName property (alternative override)
     * 3. Config $moduleMap lookup by class basename
     * 4. Default module fallback
     */
    public function resolve(Model $model): string
    {
        if (property_exists($model, 'auditModule')) {
            return $model->auditModule;
        }

        if (property_exists($model, 'auditModuleName')) {
            return $model->auditModuleName;
        }

        $className = class_basename($model);

        return $this->moduleMap[$className] ?? $this->defaultModule;
    }
}
