<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    protected function respond(mixed $data = null, bool $success = true, ?string $message = null, ?array $errors = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    protected function respondSuccess(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return $this->respond($data, true, $message, null, $status);
    }

    protected function respondError(?string $message = null, ?array $errors = null, int $status = 400): JsonResponse
    {
        return $this->respond(null, false, $message, $errors, $status);
    }
}
