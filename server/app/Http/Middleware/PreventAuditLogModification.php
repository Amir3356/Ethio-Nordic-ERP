<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PreventAuditLogModification
{
    /**
     * Block any HTTP method that could mutate audit log records.
     * Audit logs are immutable and cannot be edited or deleted via API.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $blockedMethods = ['PUT', 'PATCH', 'DELETE'];

        if (in_array($request->method(), $blockedMethods)) {
            Log::warning('Blocked attempt to modify audit logs via API.', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Audit logs are immutable and cannot be edited or deleted.',
                'error' => 'audit_logs_immutable',
            ], 403);
        }

        return $next($request);
    }
}
