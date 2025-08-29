<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PurokLeaderMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized',
                'errors' => null,
            ], 401);
        }

        // Admin has unrestricted access
        if ($user->isAdmin()) {
            return $next($request);
        }

        // Purok leaders must have an assigned purok
        if ($user->isPurokLeader() && !$user->assigned_purok_id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Access denied. Purok leader must have an assigned purok.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
