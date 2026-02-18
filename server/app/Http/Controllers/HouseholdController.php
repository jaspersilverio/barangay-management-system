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
use Illuminate\Support\Facades\Cache;

class HouseholdController extends Controller
{
    public function index(Request $request)
    {
        $query = Household::with(['purok', 'headResident'])
            ->selectRaw('households.*, (SELECT COUNT(*) FROM residents WHERE residents.deleted_at IS NULL AND residents.household_id = households.id AND residents.id != households.head_resident_id) as residents_count');
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

        // Sort alphabetically by head resident name (A-Z)
        $query->leftJoin('residents', 'households.head_resident_id', '=', 'residents.id')
              ->orderBy('residents.first_name', 'asc')
              ->orderBy('residents.last_name', 'asc')
              ->orderBy('households.head_name', 'asc');

        $households = $query->paginate($request->integer('per_page', 15));

        // Transform the response to include properly formatted data
        $households->getCollection()->transform(function ($household) {
            $headName = $household->headResident 
                ? trim($household->headResident->first_name . ' ' . ($household->headResident->middle_name ? $household->headResident->middle_name . ' ' : '') . $household->headResident->last_name)
                : ($household->head_name ?? 'N/A');
            
            return [
                'id' => $household->id,
                'address' => $household->address,
                'property_type' => $household->property_type,
                'head_name' => $headName, // For backward compatibility
                'head_resident_id' => $household->head_resident_id,
                'head_resident' => $household->headResident ? [
                    'id' => $household->headResident->id,
                    'first_name' => $household->headResident->first_name,
                    'middle_name' => $household->headResident->middle_name,
                    'last_name' => $household->headResident->last_name,
                    'full_name' => $household->headResident->full_name,
                ] : null,
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

        // Verify head_resident_id exists and is valid
        $headResident = Resident::find($data['head_resident_id']);
        if (!$headResident) {
            return $this->respondError('Head resident not found', null, 404);
        }

        // Role-based purok assignment
        if ($user->isPurokLeader()) {
            // Purok leaders can only create households in their assigned purok
            $data['purok_id'] = $user->assigned_purok_id;
        }
        // Admin can assign any purok

        // Set head_name from resident for backward compatibility
        $data['head_name'] = $headResident->full_name;

        // Ensure head resident is assigned to this household
        // If head resident doesn't have a household, assign them
        if (!$headResident->household_id) {
            // We'll set it after creating the household
        }

        $household = Household::create($data);

        // CRITICAL: Always update the head resident's household_id and relationship_to_head
        // This ensures the resident-first architecture is maintained
        $headResident->update([
            'household_id' => $household->id,
            'relationship_to_head' => 'Head',
        ]);
        
        // Refresh the head resident to ensure relationship is loaded
        $headResident->refresh();
        $headResident->load('household');

        // Load relationships for response
        $household->load(['headResident', 'purok']);
        
        // Log the update for debugging
        Log::info('Household created and resident linked', [
            'household_id' => $household->id,
            'head_resident_id' => $headResident->id,
            'resident_household_id' => $headResident->household_id,
            'purok_id' => $household->purok_id,
        ]);

        // Create notifications
        $this->createHouseholdNotifications($household, $user);

        return $this->respondSuccess($household, 'Household created', 201);
    }

    public function show(Household $household)
    {
        $household->load(['headResident', 'purok']);

        // Data integrity: ensure head has household_id set (fixes heads linked only via head_resident_id)
        if ($household->head_resident_id) {
            $head = Resident::find($household->head_resident_id);
            if ($head && !$head->household_id) {
                $head->update(['household_id' => $household->id, 'relationship_to_head' => 'Head']);
            }
        }

        // Load all residents: household_id = this household OR id = head (single source of truth)
        // Include head; head may not have household_id if linked via head_resident_id only
        $allResidents = Resident::where('household_id', $household->id)
            ->when($household->head_resident_id, function ($q) use ($household) {
                $q->orWhere('id', $household->head_resident_id);
            })
            ->get();

        // Members: exclude head to avoid duplication (head shown in header)
        $members = $allResidents
            ->filter(fn ($r) => $r->id !== $household->head_resident_id)
            ->map(function ($resident) {
                return [
                    'id' => $resident->id,
                    'first_name' => $resident->first_name,
                    'middle_name' => $resident->middle_name,
                    'last_name' => $resident->last_name,
                    'full_name' => $resident->full_name,
                    'sex' => $resident->sex,
                    'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
                    'relationship_to_head' => $resident->relationship_to_head,
                ];
            })
            ->values()
            ->all();

        $formatted = [
            'id' => $household->id,
            'address' => $household->address,
            'property_type' => $household->property_type,
            'head_name' => $household->headResident ? $household->headResident->full_name : ($household->head_name ?? 'N/A'),
            'head_resident_id' => $household->head_resident_id,
            'head_resident' => $household->headResident ? [
                'id' => $household->headResident->id,
                'first_name' => $household->headResident->first_name,
                'middle_name' => $household->headResident->middle_name,
                'last_name' => $household->headResident->last_name,
                'full_name' => $household->headResident->full_name,
            ] : null,
            'contact' => $household->contact,
            'purok_id' => $household->purok_id,
            'purok' => $household->purok ? [
                'id' => $household->purok->id,
                'name' => $household->purok->name,
            ] : null,
            'residents' => $members,
            'members' => $members,
        ];

        return $this->respondSuccess($formatted);
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

        // If head_resident_id is being updated, verify it exists
        if (isset($data['head_resident_id'])) {
            $headResident = Resident::find($data['head_resident_id']);
            if (!$headResident) {
                return $this->respondError('Head resident not found', null, 404);
            }
            
            // Update head_name for backward compatibility
            $data['head_name'] = $headResident->full_name;
            
            // Ensure head resident is assigned to this household
            if (!$headResident->household_id || $headResident->household_id !== $household->id) {
                $headResident->update([
                    'household_id' => $household->id,
                    'relationship_to_head' => 'Head',
                ]);
            }
        }

        $household->update($data);
        $household->load(['headResident', 'purok']);
        
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
        
        // Clear dashboard caches so summary reflects the deletion immediately
        $purokSuffix = $user->assigned_purok_id ?? 'admin';
        Cache::forget('dashboard_summary_' . $user->id . '_' . $purokSuffix);
        Cache::forget('dashboard_analytics_' . $user->id . '_' . $purokSuffix);
        // Also clear for admin users who might be viewing the dashboard
        if ($purokSuffix !== 'admin') {
            Cache::forget('dashboard_summary_' . $user->id . '_admin');
            Cache::forget('dashboard_analytics_' . $user->id . '_admin');
        }
        
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

        // Data integrity: ensure head has household_id set
        if ($household->head_resident_id) {
            $head = Resident::find($household->head_resident_id);
            if ($head && !$head->household_id) {
                $head->update(['household_id' => $household->id, 'relationship_to_head' => 'Head']);
            }
        }

        // Direct query: residents with household_id = this household, or head by id
        $residents = Resident::where('household_id', $household->id)
            ->when($household->head_resident_id, function ($q) use ($household) {
                $q->orWhere('id', $household->head_resident_id);
            })
            ->get();

        // Filter out the head of household from members list
        // Transform the response for the frontend
        $formattedResidents = $residents->filter(function ($resident) use ($household) {
            return $resident->id !== $household->head_resident_id;
        })->map(function ($resident) {
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
        })->values()->all();

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
            $purokName = $household->purok ? $household->purok->name : 'Unknown Purok';
            return [
                'id' => $household->id,
                'head_of_household' => $household->head_name,
                'address' => $household->address,
                'purok_id' => $household->purok_id,
                'purok_name' => $purokName,
                'label' => "{$household->head_name} – {$household->address} ({$purokName})",
            ];
        });

        return $this->respondSuccess($formattedHouseholds);
    }

    /**
     * Create notifications for new household
     */
    private function createHouseholdNotifications($household, $user)
    {
        // Get head name from resident if available
        $headName = $household->headResident 
            ? $household->headResident->full_name 
            : ($household->head_name ?? 'Unknown');
        
        // Notify admin
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            NotificationController::createUserNotification(
                $admin->id,
                'New Household Added',
                "A new household has been added: {$headName} at {$household->address}",
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
                    "A new household has been added to your purok: {$headName} at {$household->address}",
                    'household'
                );
            }
        }
    }
}
