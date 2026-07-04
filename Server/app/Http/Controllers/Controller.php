<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    protected function successResponse($data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $code);
    }

    protected function errorResponse(string $message = 'Error', int $code = 400, $data = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => $data,
            'message' => $message,
        ], $code);
    }
}
