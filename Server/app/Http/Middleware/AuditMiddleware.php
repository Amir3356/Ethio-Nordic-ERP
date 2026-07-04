<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (Auth::check() && $request->isMethod('POST')) {
            AuditLog::create([
                'user_id' => Auth::id(),
                'user_name' => Auth::user()->name,
                'action' => 'api_access',
                'module' => $this->extractModule($request->route()->getName()),
                'entity_type' => null,
                'entity_id' => null,
                'old_values' => null,
                'new_values' => [
                    'method' => $request->method(),
                    'path' => $request->path(),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => "{$request->method()} {$request->path()}",
            ]);
        }

        return $response;
    }

    private function extractModule(?string $routeName): string
    {
        if (!$routeName) {
            return 'unknown';
        }

        $parts = explode('.', $routeName);

        return $parts[0] ?? 'unknown';
    }
}
