<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserQueryService
{
    /**
     * List users with filtering, search, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('slug', $request->role);
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('verified')) {
            if ($request->boolean('verified')) {
                $query->verified();
            } else {
                $query->unverified();
            }
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * Show a single user with roles, permissions, and login activities.
     */
    public function show($id): JsonResponse
    {
        $user = User::with([
            'roles.permissions',
            'directPermissions',
            'loginActivities' => fn($q) => $q->latest()->limit(10),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'has_2fa_enabled' => $user->hasTwoFactorEnabled(),
                'last_login' => $user->last_login_at?->diffForHumans(),
            ],
        ]);
    }
}
