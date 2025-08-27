<?php

namespace App\Http\Controllers;

use App\Http\Requests\Resident\StoreResidentRequest;
use App\Http\Requests\Resident\UpdateResidentRequest;
use App\Models\Resident;
use Illuminate\Http\Request;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = Resident::with(['household.purok']);
        $user = $request->user();

        // Role-based filtering for purok leaders
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            $query->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }

        // Filter by purok_id (for admin/staff)
        if ($purokId = $request->string('purok_id')->toString()) {
            $query->whereHas('household', function ($q) use ($purokId) {
                $q->where('purok_id', $purokId);
            });
        }

        if ($gender = $request->string('gender')->toString()) {
            $query->where('sex', $gender);
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('occupation_status', $status);
        }
        if ($minAge = $request->integer('min_age')) {
            $query->whereDate('birthdate', '<=', now()->subYears($minAge)->toDateString());
        }
        if ($maxAge = $request->integer('max_age')) {
            $query->whereDate('birthdate', '>', now()->subYears($maxAge)->toDateString());
        }
        if ($request->boolean('seniors')) {
            $query->seniors();
        }
        if ($request->boolean('children')) {
            $query->children();
        }
        if ($request->boolean('pwds')) {
            $query->pwds();
        }
        if ($search = $request->string('search')->toString()) {
            $query->search($search);
        }

        $residents = $query->paginate($request->integer('per_page', 15));

        // Transform the response to include properly formatted data
        $residents->getCollection()->transform(function ($resident) {
            return [
                'id' => $resident->id,
                'household_id' => $resident->household_id,
                'first_name' => $resident->first_name,
                'middle_name' => $resident->middle_name,
                'last_name' => $resident->last_name,
                'sex' => $resident->sex,
                'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
                'relationship_to_head' => $resident->relationship_to_head,
                'occupation_status' => $resident->occupation_status,
                'is_pwd' => $resident->is_pwd,
                'age' => $resident->age,
                'household' => $resident->household ? [
                    'id' => $resident->household->id,
                    'head_name' => $resident->household->head_name,
                    'address' => $resident->household->address,
                    'purok_id' => $resident->household->purok_id,
                    'purok' => $resident->household->purok ? [
                        'id' => $resident->household->purok->id,
                        'name' => $resident->household->purok->name,
                    ] : null,
                ] : null,
            ];
        });

        return $this->respondSuccess($residents);
    }

    public function store(StoreResidentRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Auto-assign purok_id for purok leaders
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            // Verify that the household belongs to the assigned purok
            $household = \App\Models\Household::find($data['household_id']);
            if (!$household || $household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only add residents to households in your assigned purok.', null, 403);
            }
        }

        $resident = Resident::create($data);
        return $this->respondSuccess($resident, 'Resident created', 201);
    }

    public function show(Request $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can access this resident
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            if ($resident->household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('Access denied.', null, 403);
            }
        }

        // Load the resident with household and purok relationships
        $resident->load(['household.purok']);

        // Format the response for the frontend
        $formattedResident = [
            'id' => $resident->id,
            'household_id' => $resident->household_id,
            'first_name' => $resident->first_name,
            'middle_name' => $resident->middle_name,
            'last_name' => $resident->last_name,
            'sex' => $resident->sex,
            'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
            'relationship_to_head' => $resident->relationship_to_head,
            'occupation_status' => $resident->occupation_status,
            'is_pwd' => $resident->is_pwd,
            'age' => $resident->age,
            'household' => $resident->household ? [
                'id' => $resident->household->id,
                'head_name' => $resident->household->head_name,
                'address' => $resident->household->address,
                'purok_id' => $resident->household->purok_id,
                'purok' => $resident->household->purok ? [
                    'id' => $resident->household->purok->id,
                    'name' => $resident->household->purok->name,
                ] : null,
            ] : null,
        ];

        return $this->respondSuccess($formattedResident);
    }

    public function update(UpdateResidentRequest $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can edit this resident
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            if ($resident->household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only edit residents in your assigned purok.', null, 403);
            }
        }

        $data = $request->validated();

        // For purok leaders, ensure they can't change the household to one outside their purok
        if ($user && $user->role === 'purok_leader' && isset($data['household_id']) && $user->assigned_purok_id) {
            $household = \App\Models\Household::find($data['household_id']);
            if (!$household || $household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only assign residents to households in your assigned purok.', null, 403);
            }
        }

        $resident->update($data);
        return $this->respondSuccess($resident, 'Resident updated');
    }

    public function destroy(Request $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can delete this resident
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            if ($resident->household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only delete residents in your assigned purok.', null, 403);
            }
        }

        $resident->delete();
        return $this->respondSuccess(null, 'Resident deleted');
    }
}
