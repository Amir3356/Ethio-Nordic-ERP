<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserLoginActivityController extends Controller
{
    public function getUserActivity($id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $perPage = $request->get('per_page', 15);
        $activities = $user->loginActivities()
            ->orderBy('login_at', 'desc')
            ->paginate($perPage);

        return $this->successResponse([
            'user' => $user->only(['id', 'full_name', 'email']),
            'activities' => $activities,
        ]);
    }
}