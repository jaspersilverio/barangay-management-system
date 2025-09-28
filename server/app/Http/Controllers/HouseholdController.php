<?php

namespace App\Http\Controllers;

use App\Http\Controllers\NotificationController;
use App\Http\Requests\Household\StoreHouseholdRequest;
use App\Http\Requests\Household\UpdateHouseholdRequest;
use App\Models\Household;
use App\Models\User;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class HouseholdController extends Controller
{
    public function index(Request $request)
    {
        $query = Household::with('purok')->withCount('residents');
        $user = $request->user();

        // Role-based filtering
        if ($user->isPurokLeader()) {
            // Purok leaders can only see households from their assigned purok
            $query->where('purok_id', $user->assigned_purok_id);
        }
        // Admin can see all households

        if ($search = $request->string('search')->toString()) {
            $query->search($search);
        }

        $households = $query->paginate($request->integer('per_page', 15));

        // Transform the response to include properly formatted data
        $households->getCollection()->transform(function ($household) {
            return [
                'id' => $household->id,
                'address' => $household->address,
                'property_type' => $household->property_type,
                'head_name' => $household->head_name,
                'contact' => $household->contact,
                'purok_id' => $household->purok_id,
                'residents_count' => $household->residents_count,
                'purok' => $household->purok ? [
                    'id' => $household->purok->id,
                    'name' => $household->purok->name,
                ] : null,
            ];
        });

        return $this->respondSuccess($households);
    }

    public function store(StoreHouseholdRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Role-based purok assignment
        if ($user->isPurokLeader()) {
            // Purok leaders can only create households in their assigned purok
            $data['purok_id'] = $user->assigned_purok_id;
        }
        // Admin can assign any purok

        $household = Household::create($data);

        // Create notifications
        $this->createHouseholdNotifications($household, $user);

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
        if ($user->isPurokLeader() && $household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only edit households in your assigned purok', null, 403);
        }

        // Role-based purok assignment for updates
        if ($user->isPurokLeader()) {
            // Purok leaders can only update households in their assigned purok
            $data['purok_id'] = $user->assigned_purok_id;
        }
        // Admin can assign any purok

        $household->update($data);
        return $this->respondSuccess($household, 'Household updated');
    }

    public function destroy(Request $request, Household $household)
    {
        $user = $request->user();

        // Role-based access control
        if ($user->isPurokLeader() && $household->purok_id !== $user->assigned_purok_id) {
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

    public function getResidents(Request $request, Household $household)
    {
        $user = $request->user();

        // Role-based access control
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            if ($household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('Access denied.', null, 403);
            }
        }

        $residents = $household->residents()->get();

        // Transform the response for the frontend
        $formattedResidents = $residents->map(function ($resident) {
            return [
                'id' => $resident->id,
                'first_name' => $resident->first_name,
                'middle_name' => $resident->middle_name,
                'last_name' => $resident->last_name,
                'full_name' => trim($resident->first_name . ' ' . ($resident->middle_name ? $resident->middle_name . ' ' : '') . $resident->last_name),
                'sex' => $resident->sex,
                'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
                'age' => $resident->age,
                'relationship_to_head' => $resident->relationship_to_head,
                'occupation_status' => $resident->occupation_status,
                'is_pwd' => $resident->is_pwd,
            ];
        });

        return $this->respondSuccess($formattedResidents);
    }

    public function forResidentForm(Request $request)
    {
        $query = Household::with('purok');
        $user = $request->user();

        // Role-based filtering
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            // Purok leaders can only see households from their assigned purok
            $query->where('purok_id', $user->assigned_purok_id);
        }

        if ($search = $request->string('search')->toString()) {
            $query->search($search);
        }

        $households = $query->get();

        // Transform the response for dropdown
        $formattedHouseholds = $households->map(function ($household) {
            return [
                'id' => $household->id,
                'head_of_household' => $household->head_name,
                'address' => $household->address,
                'purok_name' => $household->purok ? $household->purok->name : 'Unknown Purok',
                'label' => "{$household->head_name} – {$household->address} ({$household->purok->name})",
            ];
        });

        return $this->respondSuccess($formattedHouseholds);
    }

    /**
     * Create notifications for new household
     */
    private function createHouseholdNotifications($household, $user)
    {
        // Notify admin
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            NotificationController::createUserNotification(
                $admin->id,
                'New Household Added',
                "A new household has been added: {$household->head_name} at {$household->address}",
                'household'
            );
        }

        // Notify purok leader if different from the user who created it
        if ($household->purok_id && $user->role !== 'purok_leader') {
            $purokLeader = User::where('role', 'purok_leader')
                ->where('assigned_purok_id', $household->purok_id)
                ->first();

            if ($purokLeader) {
                NotificationController::createUserNotification(
                    $purokLeader->id,
                    'New Household in Your Purok',
                    "A new household has been added to your purok: {$household->head_name} at {$household->address}",
                    'household'
                );
            }
        }
    }
}
