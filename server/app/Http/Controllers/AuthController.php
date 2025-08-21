<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterUserRequest $request)
    {
        // $actingUser = $request->user();
        // if (!$actingUser || !$actingUser->isAdmin()) {
        //     return $this->respondError('Forbidden', null, 403);
        // }

        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'assigned_purok_id' => $validated['assigned_purok_id'] ?? null,
        ]);

        return $this->respondSuccess($user->only(['id', 'name', 'email', 'role', 'assigned_purok_id']), 'User registered', 201);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->respondError('Invalid credentials', ['email' => ['These credentials do not match our records.']], 422);
        }

        // For demo purposes, create a simple token when auth is disabled
        // $token = $user->createToken('api')->plainTextToken;
        $token = 'demo-token-' . $user->id . '-' . time();

        return $this->respondSuccess([
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'role', 'assigned_purok_id']),
        ], 'Logged in');
    }

    public function logout(Request $request)
    {
        // $user = $request->user();
        // if ($user && $user->currentAccessToken()) {
        //     $user->currentAccessToken()->delete();
        // }
        return $this->respondSuccess(null, 'Logged out');
    }

    public function me(Request $request)
    {
        // $user = $request->user()->load('assignedPurok');
        // For demo purposes, return a default user when auth is disabled
        $user = User::first();
        if (!$user) {
            return $this->respondError('No users found', null, 404);
        }
        $user->load('assignedPurok');
        return $this->respondSuccess([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'assigned_purok' => $user->assignedPurok,
        ]);
    }
}
