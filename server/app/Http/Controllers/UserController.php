<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Models\Purok;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Display a listing of users with search and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('assignedPurok')
            ->withTrashed();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter by purok
        if ($request->filled('purok_id')) {
            $query->where('assigned_purok_id', $request->purok_id);
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $userData = $request->validated();
            $userData['password'] = Hash::make($userData['password']);

            $user = User::create($userData);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $user->load('assignedPurok'),
                'message' => 'User created successfully',
                'errors' => null,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to create user: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }

    /**
     * Display the specified user
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $user->load('assignedPurok'),
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        try {
            DB::beginTransaction();

            $userData = $request->validated();

            // Only hash password if it's provided
            if (isset($userData['password'])) {
                $userData['password'] = Hash::make($userData['password']);
            } else {
                unset($userData['password']);
            }

            $user->update($userData);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $user->load('assignedPurok'),
                'message' => 'User updated successfully',
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update user: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }

    /**
     * Soft delete the specified user
     */
    public function destroy(User $user): JsonResponse
    {
        try {
            $user->delete();

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'User deleted successfully',
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to delete user: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted user
     */
    public function restore($id): JsonResponse
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->restore();

            return response()->json([
                'success' => true,
                'data' => $user->load('assignedPurok'),
                'message' => 'User restored successfully',
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to restore user: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }

    /**
     * Get available roles
     */
    public function getRoles(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['value' => 'admin', 'label' => 'Administrator'],
                ['value' => 'purok_leader', 'label' => 'Purok Leader'],
                ['value' => 'staff', 'label' => 'Staff'],
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Get available puroks for assignment
     */
    public function getPuroks(): JsonResponse
    {
        $puroks = Purok::select('id', 'name')->get();

        return response()->json([
            'success' => true,
            'data' => $puroks,
            'message' => null,
            'errors' => null,
        ]);
    }
}
