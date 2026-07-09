<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(
        protected UserEmailService $emailService,
    ) {}

    /**
     * Create a new user.
     */
    public function create(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $tempPassword = Str::random(12);

            $user = User::create([
                'full_name' => $request->full_name,
                'email' => $request->email,
                'department' => $request->department,
                'password' => Hash::make($tempPassword),
                'is_active' => false,
                'temp_password_expires_at' => now()->addDays(7),
            ]);

            $user->roles()->sync($request->role_ids);

            if ($request->has('permission_ids')) {
                $user->directPermissions()->sync($request->permission_ids);
            }

            $emailSent = false;
            if ($request->get('send_email', true)) {
                $emailSent = $this->emailService->sendActivationEmail($user, $tempPassword);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user->load('roles', 'directPermissions'),
                    'temp_password' => $tempPassword,
                    'email_sent' => $emailSent,
                ],
                'message' => 'User created successfully.',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to create user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        DB::beginTransaction();
        try {
            $user->update($request->only(['full_name', 'email', 'department']));

            if ($request->has('role_ids')) {
                $user->roles()->sync($request->role_ids);
            }

            if ($request->has('permission_ids')) {
                $user->directPermissions()->sync($request->permission_ids);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $user->fresh()->load('roles', 'directPermissions'),
                'message' => 'User updated successfully.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to update user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a user permanently.
     */
    public function destroy($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->isAdmin()) {
            $adminCount = User::whereHas('roles', fn($q) => $q->where('slug', 'admin'))->count();
            if ($adminCount <= 1) {
                return response()->json(['success' => false, 'message' => 'Cannot delete the last admin user.'], 422);
            }
        }

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 422);
        }

        $user->tokens()->delete();
        $user->forceDelete();

        return response()->json(['success' => true, 'message' => 'User deleted permanently.']);
    }
}
