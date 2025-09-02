<?php

namespace App\Http\Controllers;

use App\Http\Controllers\NotificationController;
use App\Http\Requests\Resident\StoreResidentRequest;
use App\Http\Requests\Resident\UpdateResidentRequest;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Http\Request;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = Resident::with(['household.purok']);
        $user = $request->user();

        // Role-based filtering for purok leaders
        if ($user->isPurokLeader()) {
            $query->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }

        // Filter by purok_id (for admin)
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
                'full_name' => $resident->full_name,
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
        if ($user->isPurokLeader()) {
            // Verify that the household belongs to the assigned purok
            $household = \App\Models\Household::find($data['household_id']);
            if (!$household || $household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only add residents to households in your assigned purok.', null, 403);
            }
        }

        $resident = Resident::create($data);

        // Create notifications
        $this->createResidentNotifications($resident, $user);

        return $this->respondSuccess($resident, 'Resident created', 201);
    }

    public function show(Request $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can access this resident
        if ($user->isPurokLeader()) {
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
        if ($user->isPurokLeader()) {
            if ($resident->household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only edit residents in your assigned purok.', null, 403);
            }
        }

        $data = $request->validated();

        // For purok leaders, ensure they can't change the household to one outside their purok
        if ($user->isPurokLeader() && isset($data['household_id'])) {
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
        if ($user->isPurokLeader()) {
            if ($resident->household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only delete residents in your assigned purok.', null, 403);
            }
        }

        $resident->delete();
        return $this->respondSuccess(null, 'Resident deleted');
    }

    /**
     * Search for existing residents
     */
    public function search(Request $request)
    {
        $query = $request->string('query')->toString();
        $user = $request->user();

        if (empty($query) || strlen($query) < 2) {
            return $this->respondSuccess(['data' => []]);
        }

        $residentsQuery = Resident::with(['household.purok'])
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                    ->orWhere('middle_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$query}%"]);
            });

        // Role-based filtering for purok leaders
        if ($user->isPurokLeader()) {
            $residentsQuery->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }

        $residents = $residentsQuery->limit(10)->get();

        $formattedResidents = $residents->map(function ($resident) {
            return [
                'id' => $resident->id,
                'full_name' => $resident->full_name,
                'age' => $resident->age,
                'sex' => $resident->sex,
                'household_id' => $resident->household_id,
                'household' => $resident->household ? [
                    'id' => $resident->household->id,
                    'head_name' => $resident->household->head_name,
                    'address' => $resident->household->address,
                    'purok' => $resident->household->purok ? [
                        'id' => $resident->household->purok->id,
                        'name' => $resident->household->purok->name,
                    ] : null,
                ] : null,
            ];
        });

        return $this->respondSuccess(['data' => $formattedResidents]);
    }

    /**
     * Link an existing resident to a household
     */
    public function linkToHousehold(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'resident_id' => 'required|exists:residents,id',
            'household_id' => 'required|exists:households,id',
        ]);

        if ($validator->fails()) {
            return $this->respondError('Validation failed', $validator->errors()->toArray(), 422);
        }

        $user = $request->user();
        $resident = Resident::findOrFail($request->resident_id);
        $household = \App\Models\Household::findOrFail($request->household_id);

        // Check if purok leader can perform this action
        if ($user->isPurokLeader()) {
            if ($household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only link residents to households in your assigned purok.', null, 403);
            }
        }

        // Check if resident is already linked to a household
        if ($resident->household_id) {
            return $this->respondError('This resident is already linked to a household.', null, 422);
        }

        // Link resident to household
        $resident->update(['household_id' => $request->household_id]);

        // Load the updated resident with household data
        $resident->load(['household.purok']);

        return $this->respondSuccess($resident, 'Resident linked to household successfully');
    }

    /**
     * Create notifications for new resident
     */
    private function createResidentNotifications($resident, $user)
    {
        $fullName = trim($resident->first_name . ' ' . ($resident->middle_name ? $resident->middle_name . ' ' : '') . $resident->last_name);
        $householdAddress = $resident->household->address ?? 'Unknown address';

        // Notify admin
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            NotificationController::createUserNotification(
                $admin->id,
                'New Resident Added',
                "A new resident has been added: {$fullName} at {$householdAddress}",
                'resident'
            );
        }

        // Notify purok leader if different from the user who created it
        if ($resident->household->purok_id && $user->role !== 'purok_leader') {
            $purokLeader = User::where('role', 'purok_leader')
                ->where('assigned_purok_id', $resident->household->purok_id)
                ->first();

            if ($purokLeader) {
                NotificationController::createUserNotification(
                    $purokLeader->id,
                    'New Resident in Your Purok',
                    "A new resident has been added to your purok: {$fullName} at {$householdAddress}",
                    'resident'
                );
            }
        }
    }
}
