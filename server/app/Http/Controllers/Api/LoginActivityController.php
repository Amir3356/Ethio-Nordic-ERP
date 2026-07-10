<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LoginActivity::with('user');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('ip_address')) {
            $query->where('ip_address', 'like', "%{$request->ip_address}%");
        }

        if ($request->filled('date_from')) {
            $query->where('login_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('login_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 15);
        $activities = $query->orderBy('login_at', 'desc')->paginate($perPage);

        return $this->successResponse($activities);
    }

    public function show($id): JsonResponse
    {
        $activity = LoginActivity::with('user')->findOrFail($id);
        return $this->successResponse($activity);
    }
}