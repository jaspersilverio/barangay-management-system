<?php

namespace App\Http\Controllers;

use App\Http\Requests\Household\StoreHouseholdRequest;
use App\Http\Requests\Household\UpdateHouseholdRequest;
use App\Models\Household;
use App\Models\User;
use App\Models\Resident;
use Illuminate\Http\Request;

class HouseholdController extends Controller
{
    public function index(Request $request)
    {
        $query = Household::query();
        $user = $request->user();

        // Role-based filtering
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            // Purok leaders can only see households from their assigned purok
            $query->where('purok_id', $user->assigned_purok_id);
        }
        // Admin, staff, and viewer users can see all households

        if ($search = $request->string('search')->toString()) {
            $query->search($search);
        }

        $households = $query->paginate($request->integer('per_page', 15));
        return $this->respondSuccess($households);
    }

    public function store(StoreHouseholdRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Role-based purok assignment
        if ($user && $user->role === 'purok_leader') {
            // Purok leaders can only create households in their assigned purok
            $data['purok_id'] = $user->assigned_purok_id;
        }
        // Admin and staff can assign any purok

        $household = Household::create($data);
        return $this->respondSuccess($household, 'Household created', 201);
    }

    public function show(Household $household)
    {
        $household->load(['residents']);
        return $this->respondSuccess($household);
    }

    public function update(UpdateHouseholdRequest $request, Household $household)
    {
        $user = $request->user();
        $data = $request->validated();

        // Role-based access control
        if ($user && $user->role === 'purok_leader' && $household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only edit households in your assigned purok', null, 403);
        }

        // Role-based purok assignment for updates
        if ($user && $user->role === 'purok_leader') {
            // Purok leaders can only update households in their assigned purok
            $data['purok_id'] = $user->assigned_purok_id;
        }
        // Admin and staff can assign any purok

        $household->update($data);
        return $this->respondSuccess($household, 'Household updated');
    }

    public function destroy(Request $request, Household $household)
    {
        $user = $request->user();

        // Role-based access control
        if ($user && $user->role === 'purok_leader' && $household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only delete households in your assigned purok', null, 403);
        }

        $force = $request->boolean('force');
        if ($force) {
            Resident::where('household_id', $household->id)->delete();
        }
        $household->delete();
        return $this->respondSuccess(null, 'Household deleted');
    }

    public function members(Household $household)
    {
        $residents = $household->residents()->paginate(50);
        return $this->respondSuccess($residents);
    }
}
