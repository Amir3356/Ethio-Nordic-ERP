<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserBulkActionService
{
    /**
     * Perform bulk actions on users.
     */
    public function bulkAction(Request $request): JsonResponse
    {
        if (in_array(auth()->id(), $request->user_ids)) {
            return response()->json(['success' => false, 'message' => 'You cannot perform bulk actions on your own account.'], 422);
        }

        $users = User::whereIn('id', $request->user_ids)->get();
        $action = $request->action;
        $successCount = 0;
        $failedCount = 0;

        foreach ($users as $user) {
            try {
                switch ($action) {
                    case 'activate':
                        $user->activate();
                        $successCount++;
                        break;

                    case 'deactivate':
                        if ($user->isAdmin()) {
                            $adminCount = User::active()->whereHas('roles', fn($q) => $q->where('slug', 'admin'))->count();
                            if ($adminCount <= 1) {
                                $failedCount++;
                                continue 2;
                            }
                        }
                        $user->deactivate();
                        $successCount++;
                        break;

                    case 'delete':
                        if ($user->isAdmin()) {
                            $adminCount = User::whereHas('roles', fn($q) => $q->where('slug', 'admin'))->count();
                            if ($adminCount <= 1) {
                                $failedCount++;
                                continue 2;
                            }
                        }
                        $user->tokens()->delete();
                        $user->delete();
                        $successCount++;
                        break;
                }
            } catch (\Exception $e) {
                $failedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'success_count' => $successCount,
                'failed_count' => $failedCount,
            ],
            'message' => "Bulk {$action} completed. {$successCount} successful, {$failedCount} failed.",
        ]);
    }
}
