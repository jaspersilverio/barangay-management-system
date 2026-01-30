<?php

namespace App\Http\Controllers;

use App\Http\Requests\Vaccination\StoreVaccinationRequest;
use App\Http\Requests\Vaccination\UpdateVaccinationRequest;
use App\Models\Vaccination;
use App\Models\Resident;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class VaccinationController extends Controller
{
    /**
     * Invalidate dashboard cache for all users
     */
    private function invalidateDashboardCache()
    {
        // Clear dashboard summary cache for all users
        Cache::flush(); // This clears all cache, but for production you might want to be more specific

        // Alternative: Clear specific cache keys (more efficient for production)
        // $users = \App\Models\User::all();
        // foreach ($users as $user) {
        //     $cacheKey = 'dashboard_summary_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');
        //     Cache::forget($cacheKey);
        //     $vaccinationCacheKey = 'dashboard_vaccination_summary_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');
        //     Cache::forget($vaccinationCacheKey);
        // }
    }
    /**
     * Display a listing of vaccinations for a specific resident.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Vaccination::with(['resident.household.purok']);

            // Filter by resident if provided
            if ($request->has('resident_id')) {
                $query->where('resident_id', $request->resident_id);
            }

            // Apply filters (by computed status: completed, scheduled, pending, overdue)
            if ($request->filled('status')) {
                $query->computedStatus($request->status);
            }

            if ($request->filled('vaccine_name')) {
                $query->byVaccine($request->vaccine_name);
            }

            if ($request->filled('purok_id')) {
                $query->byPurok($request->purok_id);
            }

            if ($request->filled('date_from') && $request->filled('date_to')) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            if ($request->filled('age_group')) {
                $ageGroup = $request->age_group;
                switch ($ageGroup) {
                    case 'children':
                        $query->byAgeGroup(0, 17);
                        break;
                    case 'adults':
                        $query->byAgeGroup(18, 59);
                        break;
                    case 'seniors':
                        $query->byAgeGroup(60);
                        break;
                }
            }

            // Search functionality
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('vaccine_name', 'like', "%{$search}%")
                        ->orWhere('dose_number', 'like', "%{$search}%")
                        ->orWhere('administered_by', 'like', "%{$search}%")
                        ->orWhereHas('resident', function ($subQ) use ($search) {
                            $subQ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            }

            $perPage = $request->get('per_page', 15);
            $vaccinations = $query->orderByRaw('COALESCE(schedule_date, date_administered, completed_at) DESC')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $vaccinations,
                'message' => 'Vaccinations retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving vaccinations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vaccinations'
            ], 500);
        }
    }

    /**
     * Store a newly created vaccination record.
     */
    public function store(StoreVaccinationRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $data['completed_doses'] = 0;
            $data['completed_at'] = null;
            $data['next_due_date'] = null;
            if ($data['vaccination_type'] !== 'fixed_dose') {
                $data['required_doses'] = null;
            }

            $vaccination = Vaccination::create($data);
            $vaccination->load(['resident.household.purok']);

            $this->invalidateDashboardCache();

            return response()->json([
                'success' => true,
                'data' => $vaccination,
                'message' => 'Vaccination record created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating vaccination: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vaccination record'
            ], 500);
        }
    }

    /**
     * Display the specified vaccination record.
     */
    public function show(Vaccination $vaccination): JsonResponse
    {
        try {
            $vaccination->load(['resident.household.purok']);

            return response()->json([
                'success' => true,
                'data' => $vaccination,
                'message' => 'Vaccination record retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving vaccination: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vaccination record'
            ], 500);
        }
    }

    /**
     * Update the specified vaccination record.
     */
    public function update(UpdateVaccinationRequest $request, Vaccination $vaccination): JsonResponse
    {
        try {
            $data = $request->validated();

            unset($data['completed_at'], $data['completed_doses'], $data['next_due_date']);
            if ($data['vaccination_type'] !== 'fixed_dose') {
                $data['required_doses'] = null;
            }

            $vaccination->update($data);
            $vaccination->load(['resident.household.purok']);

            $this->invalidateDashboardCache();

            return response()->json([
                'success' => true,
                'data' => $vaccination,
                'message' => 'Vaccination record updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating vaccination: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update vaccination record'
            ], 500);
        }
    }

    /**
     * Mark one dose as completed (user-confirmed via checkbox).
     * Increments completed_doses, sets completed_at; computes next_due_date if more doses required.
     */
    public function complete(Vaccination $vaccination): JsonResponse
    {
        try {
            if (!$vaccination->can_complete) {
                return response()->json([
                    'success' => false,
                    'message' => 'This vaccination cannot be marked complete at this time (only pending or overdue can be completed).',
                ], 422);
            }

            $today = Carbon::today();
            $vaccination->completed_doses = (int) $vaccination->completed_doses + 1;
            $vaccination->date_administered = $today; // record when this dose was given

            $isFixedDose = $vaccination->vaccination_type === 'fixed_dose';
            $required = (int) ($vaccination->required_doses ?? 0);

            if ($isFixedDose && $required > 0 && $vaccination->completed_doses < $required) {
                // More doses needed: set schedule_date to next due (4 weeks)
                $vaccination->schedule_date = $today->copy()->addWeeks(4);
                $vaccination->next_due_date = $vaccination->schedule_date;
                $vaccination->completed_at = null; // not fully completed until all doses
            } elseif ($isFixedDose && $required > 0 && $vaccination->completed_doses >= $required) {
                // All doses done
                $vaccination->completed_at = $today;
                $vaccination->schedule_date = null;
                $vaccination->next_due_date = null;
            } elseif ($vaccination->vaccination_type === 'annual') {
                // One dose done; next in 1 year
                $vaccination->completed_at = $today;
                $vaccination->schedule_date = $today->copy()->addYear();
                $vaccination->next_due_date = $vaccination->schedule_date;
            } else {
                // booster / as_needed: one dose done
                $vaccination->completed_at = $today;
                $vaccination->schedule_date = null;
                $vaccination->next_due_date = null;
            }

            $vaccination->save();
            $vaccination->load(['resident.household.purok']);

            $this->invalidateDashboardCache();

            return response()->json([
                'success' => true,
                'data' => $vaccination,
                'message' => 'Vaccination dose marked as completed',
            ]);
        } catch (\Exception $e) {
            Log::error('Error completing vaccination: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark vaccination as completed',
            ], 500);
        }
    }

    /**
     * Remove the specified vaccination record.
     */
    public function destroy(Vaccination $vaccination): JsonResponse
    {
        try {
            $vaccination->delete();

            // Invalidate dashboard cache to reflect deleted vaccination data
            $this->invalidateDashboardCache();

            return response()->json([
                'success' => true,
                'message' => 'Vaccination record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting vaccination: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete vaccination record'
            ], 500);
        }
    }

    /**
     * Get vaccinations for a specific resident.
     */
    public function getResidentVaccinations(Resident $resident): JsonResponse
    {
        try {
            $vaccinations = $resident->vaccinations()
                ->orderBy('date_administered', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $vaccinations,
                'message' => 'Resident vaccinations retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving resident vaccinations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve resident vaccinations'
            ], 500);
        }
    }

    /**
     * Get vaccination statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $query = Vaccination::query();

            // Apply filters if provided
            if ($request->filled('purok_id')) {
                $query->byPurok($request->purok_id);
            }

            if ($request->filled('date_from') && $request->filled('date_to')) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            $baseQuery = clone $query;
            $today = Carbon::today()->toDateString();
            $stats = [
                'total_vaccinations' => $baseQuery->count(),
                'by_status' => [
                    'completed' => (clone $query)->whereNotNull('completed_at')->count(),
                    'scheduled' => (clone $query)->whereNull('completed_at')->whereNotNull('schedule_date')->whereDate('schedule_date', '>', $today)->count(),
                    'pending' => (clone $query)->whereNull('completed_at')->whereNotNull('schedule_date')->whereDate('schedule_date', $today)->count(),
                    'overdue' => (clone $query)->whereNull('completed_at')->whereNotNull('schedule_date')->whereDate('schedule_date', '<', $today)->count(),
                ],
                'by_vaccine' => $query->selectRaw('vaccine_name, COUNT(*) as count')
                    ->groupBy('vaccine_name')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->pluck('count', 'vaccine_name'),
                'by_purok' => $query->join('residents', 'vaccinations.resident_id', '=', 'residents.id')
                    ->join('households', 'residents.household_id', '=', 'households.id')
                    ->join('puroks', 'households.purok_id', '=', 'puroks.id')
                    ->selectRaw('puroks.name, COUNT(*) as count')
                    ->groupBy('puroks.id', 'puroks.name')
                    ->orderBy('count', 'desc')
                    ->pluck('count', 'name'),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Vaccination statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving vaccination statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vaccination statistics'
            ], 500);
        }
    }
}
