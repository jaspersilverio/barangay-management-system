<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cookie;

class AuthController extends Controller
{
    public function register(RegisterUserRequest $request)
    {
        return $this->respondError('User registration is disabled. Contact the administrator.', null, 403);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->respondError('Invalid credentials', ['email' => ['These credentials do not match our records.']], 422);
        }

        // Create a real Sanctum token
        $token = $user->createToken('api')->plainTextToken;

        // Create httpOnly cookie
        $cookie = cookie(
            'auth_token',
            $token,
            60 * 24 * 7, // 7 days
            '/',
            null,
            true, // secure (HTTPS only)
            true, // httpOnly
            false,
            'strict' // sameSite
        );

        return $this->respondSuccess([
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'role', 'assigned_purok_id']),
        ], 'Logged in');
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        // Clear the cookie
        $cookie = cookie(
            'auth_token',
            '',
            -1, // Expire immediately
            '/',
            null,
            true,
            true,
            false,
            'strict'
        );

        return $this->respondSuccess(null, 'Logged out');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('assignedPurok');
        if (!$user) {
            return $this->respondError('No users found', null, 404);
        }
        return $this->respondSuccess([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'assigned_purok' => $user->assignedPurok,
        ]);
    }
}
