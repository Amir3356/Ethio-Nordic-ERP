<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RbacMiddleware
{
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        if (!$user->canPerform($module, $action)) {
            AuditLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'action' => 'unauthorized_access',
                'module' => $module,
                'entity_type' => null,
                'entity_id' => null,
                'old_values' => null,
                'new_values' => ['action' => $action],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => "Unauthorized access attempt: {$module}.{$action}",
            ]);

            return response()->json([
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}
