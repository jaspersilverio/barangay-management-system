<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized',
                'errors' => null,
            ], 401);
        }

        $user = $request->user();
        $hasRole = false;

        foreach ($roles as $role) {
            switch ($role) {
                case 'admin':
                    if ($user->isAdmin()) {
                        $hasRole = true;
                        break 2;
                    }
                    break;
                case 'purok_leader':
                    if ($user->isPurokLeader()) {
                        $hasRole = true;
                        break 2;
                    }
                    break;
                case 'staff':
                    if ($user->isStaff()) {
                        $hasRole = true;
                        break 2;
                    }
                    break;
                case 'viewer':
                    if ($user->isViewer()) {
                        $hasRole = true;
                        break 2;
                    }
                    break;
            }
        }

        if (!$hasRole) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Access denied. Insufficient privileges.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
