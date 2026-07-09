<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public function __construct(
        protected AuditModuleResolver $moduleResolver,
        protected AuditDataFilter $dataFilter,
    ) {}

    /**
     * Create an audit log record.
     */
    public function log(
        Model $model,
        string $action,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): void {
        try {
            $user = Auth::user();
            $request = request();

            $log = new AuditLog();
            $log->forceFill([
                'user_id' => $user?->id,
                'email' => $user?->email ?? 'system',
                'full_name' => $user?->full_name ?? 'System',
                'action' => $action,
                'module' => $this->moduleResolver->resolve($model),
                'model_type' => get_class($model),
                'model_id' => $model->getKey(),
                'before_data' => $oldValues,
                'after_data' => $newValues,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
            $log->save();
        } catch (\Exception $e) {
            \Log::error('Audit logging failed: ' . $e->getMessage(), [
                'model' => get_class($model),
                'action' => $action,
                'model_id' => $model->getKey(),
            ]);
        }
    }

    /**
     * Get filtered auditable attributes from a model or array.
     */
    public function getAuditableAttributes(array|Model $data): array
    {
        return $this->dataFilter->filter($data);
    }
}
