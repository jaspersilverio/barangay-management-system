<?php

namespace App\Http\Controllers;

use App\Http\Requests\Vaccination\StoreVaccinationRequest;
use App\Http\Requests\Vaccination\UpdateVaccinationRequest;
use App\Models\Vaccination;
use App\Models\Resident;
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

            // Apply filters
            if ($request->filled('status')) {
                $query->byStatus($request->status);
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
            $vaccinations = $query->orderBy('date_administered', 'desc')->paginate($perPage);

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

            // Check for duplicate vaccination (same resident, same vaccine, same date)
            $existingVaccination = Vaccination::where('resident_id', $data['resident_id'])
                ->where('vaccine_name', $data['vaccine_name'])
                ->where('date_administered', $data['date_administered'])
                ->first();

            if ($existingVaccination) {
                return response()->json([
                    'success' => false,
                    'message' => 'A vaccination record for this resident with the same vaccine and date already exists.',
                    'errors' => [
                        'duplicate' => ['This vaccination record already exists for this resident on this date.']
                    ]
                ], 422);
            }

            $vaccination = Vaccination::create($data);
            $vaccination->load(['resident.household.purok']);

            // Invalidate dashboard cache to reflect new vaccination data
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

            // Check for duplicate vaccination (excluding current record)
            $existingVaccination = Vaccination::where('resident_id', $data['resident_id'])
                ->where('vaccine_name', $data['vaccine_name'])
                ->where('date_administered', $data['date_administered'])
                ->where('id', '!=', $vaccination->id)
                ->first();

            if ($existingVaccination) {
                return response()->json([
                    'success' => false,
                    'message' => 'A vaccination record for this resident with the same vaccine and date already exists.',
                    'errors' => [
                        'duplicate' => ['This vaccination record already exists for this resident on this date.']
                    ]
                ], 422);
            }

            $vaccination->update($data);
            $vaccination->load(['resident.household.purok']);

            // Invalidate dashboard cache to reflect updated vaccination data
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

            $stats = [
                'total_vaccinations' => $query->count(),
                'by_status' => $query->selectRaw('status, COUNT(*) as count')
                    ->groupBy('status')
                    ->pluck('count', 'status'),
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
