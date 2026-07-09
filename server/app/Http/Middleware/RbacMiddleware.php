<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RbacMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $permission  Permission slug (e.g., "users.view") OR role slug (e.g., "role:admin")
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $user = Auth::user();

        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Please log in to access this resource.',
                'error' => 'unauthorized'
            ], 401);
        }

        // Check if user account is active
        if (!$user->is_active) {
            // Log the attempt
            $this->logUnauthorizedAccess($request, $user, 'Account deactivated');
            
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact your administrator.',
                'error' => 'account_inactive'
            ], 403);
        }

        // Check if email is verified (optional, can be configured)
        if (is_null($user->email_verified_at) && config('auth.require_email_verification', false)) {
            return response()->json([
                'message' => 'Please verify your email address before accessing this resource.',
                'error' => 'email_not_verified'
            ], 403);
        }

        // If no specific permission is required, just ensure user is authenticated and active
        if (!$permission) {
            return $next($request);
        }

        // Check if it's a role check (format: "role:admin")
        if (str_starts_with($permission, 'role:')) {
            $roleSlug = substr($permission, 5);
            
            if (!$user->hasRole($roleSlug)) {
                $this->logUnauthorizedAccess($request, $user, "Missing role: {$roleSlug}");
                
                return response()->json([
                    'message' => 'You do not have the required role to perform this action.',
                    'error' => 'insufficient_role',
                    'required_role' => $roleSlug
                ], 403);
            }
            
            return $next($request);
        }

        // Check for multiple permissions (format: "permission1|permission2")
        if (str_contains($permission, '|')) {
            $permissions = explode('|', $permission);
            
            if (!$user->hasAnyPermission($permissions)) {
                $this->logUnauthorizedAccess($request, $user, "Missing any of permissions: " . implode(', ', $permissions));
                
                return response()->json([
                    'message' => 'You do not have any of the required permissions to perform this action.',
                    'error' => 'insufficient_permissions',
                    'required_permissions' => $permissions
                ], 403);
            }
            
            return $next($request);
        }

        // Check for multiple permissions (all required, format: "permission1&permission2")
        if (str_contains($permission, '&')) {
            $permissions = explode('&', $permission);
            
            if (!$user->hasAllPermissions($permissions)) {
                $this->logUnauthorizedAccess($request, $user, "Missing all required permissions: " . implode(', ', $permissions));
                
                return response()->json([
                    'message' => 'You do not have all the required permissions to perform this action.',
                    'error' => 'insufficient_permissions',
                    'required_permissions' => $permissions
                ], 403);
            }
            
            return $next($request);
        }

        // Single permission check by slug
        if (!$user->hasPermission($permission)) {
            $this->logUnauthorizedAccess($request, $user, "Missing permission: {$permission}");
            
            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'error' => 'insufficient_permissions',
                'required_permission' => $permission
            ], 403);
        }

        return $next($request);
    }

    /**
     * Log unauthorized access attempts for security monitoring
     */
    private function logUnauthorizedAccess(Request $request, $user, string $reason): void
    {
        try {
            $log = new AuditLog();
            $log->forceFill([
                'user_id' => $user->id,
                'email' => $user->email,
                'action' => 'unauthorized_access_attempt',
                'module' => 'Security',
                'model_type' => 'Access Control',
                'model_id' => null,
                'before_data' => null,
                'after_data' => [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'reason' => $reason,
                    'attempted_at' => now()->toDateTimeString(),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            $log->save();

            Log::warning('Unauthorized access attempt', [
                'user_id' => $user->id,
                'email' => $user->email,
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'reason' => $reason,
                'ip' => $request->ip(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log unauthorized access: ' . $e->getMessage());
        }
    }
}

