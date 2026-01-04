<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\Purok;
use App\Models\Resident;
use App\Models\Vaccination;
use App\Models\Blotter;
use App\Models\FourPsBeneficiary;
use App\Models\SoloParent;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function summary()
    {
        $user = request()->user();
        $now = Carbon::now();

        // Create cache key based on user role and purok
        $cacheKey = 'dashboard_summary_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');

        return Cache::remember($cacheKey, 300, function () use ($user, $now) { // 5 minutes cache
            // Apply role-based filtering
            $householdQuery = Household::query();
            $residentQuery = Resident::query();
            $purokQuery = Purok::query();

            if ($user->isPurokLeader()) {
                $householdQuery->where('purok_id', $user->assigned_purok_id);
                $residentQuery->whereHas('household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
                $purokQuery->where('id', $user->assigned_purok_id);
            }

            $totalHouseholds = $householdQuery->count();
            $totalResidents = $residentQuery->count();
            $purokCount = $purokQuery->count();

            // Seed minimal demo data if database is empty
            if ($totalHouseholds === 0 && $totalResidents === 0 && $purokCount === 0) {
                $p = Purok::query()->create([
                    'name' => 'Purok 1',
                    'code' => 'P1',
                ]);

                $h1 = Household::query()->create([
                    'address' => 'Blk 1 Lot 2, Poblacion Sur',
                    'property_type' => 'house',
                    'head_name' => 'Juan Dela Cruz',
                    'contact' => '09123456789',
                    'purok_id' => $p->id,
                ]);
                $h2 = Household::query()->create([
                    'address' => 'Sitio Riverside, Poblacion Sur',
                    'property_type' => 'house',
                    'head_name' => 'Maria Santos',
                    'contact' => '09112223333',
                    'purok_id' => $p->id,
                ]);

                Resident::query()->create([
                    'household_id' => $h1->id,
                    'first_name' => 'Pedro',
                    'middle_name' => null,
                    'last_name' => 'Dela Cruz',
                    'sex' => 'male',
                    'birthdate' => $now->copy()->subYears(65)->toDateString(), // senior
                    'relationship_to_head' => 'Spouse',
                    'occupation_status' => 'retired',
                    'is_pwd' => false,
                ]);

                Resident::query()->create([
                    'household_id' => $h1->id,
                    'first_name' => 'Ana',
                    'middle_name' => null,
                    'last_name' => 'Dela Cruz',
                    'sex' => 'female',
                    'birthdate' => $now->copy()->subMonths(6)->toDateString(), // infant
                    'relationship_to_head' => 'Child',
                    'occupation_status' => 'other', // stub for pregnant rule
                    'is_pwd' => false,
                ]);

                Resident::query()->create([
                    'household_id' => $h2->id,
                    'first_name' => 'Jose',
                    'middle_name' => null,
                    'last_name' => 'Santos',
                    'sex' => 'male',
                    'birthdate' => $now->copy()->subYears(40)->toDateString(),
                    'relationship_to_head' => 'Sibling',
                    'occupation_status' => 'unemployed',
                    'is_pwd' => true, // PWD
                ]);

                // Recalculate after seed
                $totalHouseholds = Household::query()->count();
                $totalResidents = Resident::query()->count();
                $purokCount = Purok::query()->count();
            }

            $seniors = $residentQuery->clone()
                ->whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())
                ->count();

            $infants = $residentQuery->clone()
                ->whereDate('birthdate', '>=', $now->copy()->subYears(1)->toDateString())
                ->count();

            $pwd = $residentQuery->clone()->where('is_pwd', true)->count();

            // Count pregnant women using the is_pregnant field
            $pregnant = $residentQuery->clone()
                ->where('is_pregnant', true)
                ->count();

            $activePuroks = $purokCount;

            // Get residents by purok - optimized query
            $residentsByPurokQuery = Purok::withCount(['households' => function ($query) {
                $query->withCount('residents');
            }]);

            if ($user->isPurokLeader()) {
                $residentsByPurokQuery->where('id', $user->assigned_purok_id);
            }

            $residentsByPurok = $residentsByPurokQuery->orderBy('name')
                ->get()
                ->map(function ($purok) {
                    // Use a single optimized query to get residents count
                    $residentsCount = DB::table('residents')
                        ->join('households', 'residents.household_id', '=', 'households.id')
                        ->where('households.purok_id', $purok->id)
                        ->whereNull('residents.deleted_at')
                        ->count();

                    return [
                        'purok' => $purok->name,
                        'count' => $residentsCount
                    ];
                });

            // Get households by purok
            $householdsByPurokQuery = Purok::withCount('households');

            if ($user->isPurokLeader()) {
                $householdsByPurokQuery->where('id', $user->assigned_purok_id);
            }

            $householdsByPurok = $householdsByPurokQuery->orderBy('name')
                ->get()
                ->map(function ($purok) {
                    return [
                        'purok' => $purok->name,
                        'count' => (int) $purok->households_count
                    ];
                });

            // Get vaccination summary
            $vaccinationQuery = Vaccination::query();

            if ($user->isPurokLeader()) {
                $vaccinationQuery->whereHas('resident.household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
            }

            $vaccinationSummary = [
                'completed' => $vaccinationQuery->clone()->where('status', 'Completed')->count(),
                'pending' => $vaccinationQuery->clone()->where('status', 'Pending')->count(),
                'scheduled' => $vaccinationQuery->clone()->where('status', 'Scheduled')->count(),
                'total' => $vaccinationQuery->clone()->count(),
            ];

            // Get blotter summary
            $blotterQuery = Blotter::query();

            if ($user->isPurokLeader()) {
                // For purok leaders, we need to filter blotters by complainant/respondent purok
                // This is more complex since blotters don't directly have purok_id
                // We'll filter by residents in their assigned purok
                $blotterQuery->where(function ($q) use ($user) {
                    $q->whereHas('complainant.household', function ($subQ) use ($user) {
                        $subQ->where('purok_id', $user->assigned_purok_id);
                    })->orWhereHas('respondent.household', function ($subQ) use ($user) {
                        $subQ->where('purok_id', $user->assigned_purok_id);
                    });
                });
            }

            $activeBlotters = $blotterQuery->clone()
                ->whereIn('status', ['Open', 'Ongoing'])
                ->count();

            $resolvedThisMonth = $blotterQuery->clone()
                ->where('status', 'Resolved')
                ->whereMonth('updated_at', $now->month)
                ->whereYear('updated_at', $now->year)
                ->count();

            $blotterSummary = [
                'active' => $activeBlotters,
                'resolvedThisMonth' => $resolvedThisMonth,
            ];

            $data = [
                'total_households' => $totalHouseholds,
                'total_residents' => $totalResidents,
                'vulnerable_population' => [
                    'seniors' => $seniors,
                    'pwd' => $pwd,
                    'pregnant' => $pregnant,
                    'infants' => $infants,
                ],
                'active_puroks' => $activePuroks,
                'residents_by_purok' => $residentsByPurok,
                'households_by_purok' => $householdsByPurok,
                'vaccination_summary' => $vaccinationSummary,
                'blotter_summary' => $blotterSummary,
            ];

            return $this->respondSuccess($data);
        });
    }

    public function analytics()
    {
        $user = request()->user();
        $now = Carbon::now();

        // Create cache key based on user role and purok
        $cacheKey = 'dashboard_analytics_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');

        return Cache::remember($cacheKey, 600, function () use ($user, $now) { // 10 minutes cache

            // Apply role-based filtering
            $residentQuery = Resident::query();
            $purokQuery = Purok::withCount('households');

            if ($user->isPurokLeader()) {
                $residentQuery->whereHas('household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
                $purokQuery->where('id', $user->assigned_purok_id);
            }

            // Households by purok - include all puroks with counts
            $householdsByPurok = $purokQuery->orderBy('name')
                ->get()
                ->map(function ($purok) {
                    return [
                        'purok' => $purok->name,
                        'count' => (int) $purok->households_count
                    ];
                });

            // Residents by age group
            $children = $residentQuery->clone()
                ->whereDate('birthdate', '>', $now->copy()->subYears(18)->toDateString())
                ->count();

            $adults = $residentQuery->clone()
                ->whereDate('birthdate', '<=', $now->copy()->subYears(18)->toDateString())
                ->whereDate('birthdate', '>', $now->copy()->subYears(60)->toDateString())
                ->count();

            $seniors = $residentQuery->clone()
                ->whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())
                ->count();

            $residentsByAgeGroup = [
                'children' => $children,
                'adults' => $adults,
                'seniors' => $seniors,
            ];

            // Monthly registrations (last 6 months)
            $monthlyRegistrations = collect();
            for ($i = 5; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);
                $count = Resident::query()
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $monthlyRegistrations->push([
                    'month' => $month->format('Y-m'),
                    'residents' => $count
                ]);
            }

            // Vulnerable trends (last 6 months)
            $vulnerableTrends = collect();
            for ($i = 5; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);

                $seniorsCount = Resident::query()
                    ->whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $pwdCount = Resident::query()
                    ->where('is_pwd', true)
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $infantsCount = Resident::query()
                    ->whereDate('birthdate', '>=', $now->copy()->subYears(1)->toDateString())
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $vulnerableTrends->push([
                    'month' => $month->format('Y-m'),
                    'seniors' => $seniorsCount,
                    'pwd' => $pwdCount,
                    'infants' => $infantsCount,
                ]);
            }

            $data = [
                'households_by_purok' => $householdsByPurok,
                'residents_by_age_group' => $residentsByAgeGroup,
                'monthly_registrations' => $monthlyRegistrations,
                'vulnerable_trends' => $vulnerableTrends,
            ];

            return $this->respondSuccess($data);
        });
    }

    public function monthlyRegistrations()
    {
        $now = Carbon::now();

        return Cache::remember('dashboard_monthly_registrations', 1800, function () use ($now) { // 30 minutes cache
            $data = collect();

            // Last 12 months of registrations
            for ($i = 11; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);

                $householdsCount = Household::query()
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $residentsCount = Resident::query()
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $data->push([
                    'month' => $month->format('M Y'),
                    'households' => $householdsCount,
                    'residents' => $residentsCount,
                ]);
            }

            return $this->respondSuccess($data);
        });
    }

    public function vulnerableTrends()
    {
        $now = Carbon::now();

        return Cache::remember('dashboard_vulnerable_trends', 1800, function () use ($now) { // 30 minutes cache
            $data = collect();

            // Last 12 months of vulnerable population trends
            for ($i = 11; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);

                $seniorsCount = Resident::query()
                    ->whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $pwdCount = Resident::query()
                    ->where('is_pwd', true)
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $pregnantCount = Resident::query()
                    ->where('is_pregnant', true)
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $infantsCount = Resident::query()
                    ->whereDate('birthdate', '>=', $now->copy()->subYears(1)->toDateString())
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $data->push([
                    'month' => $month->format('M Y'),
                    'seniors' => $seniorsCount,
                    'pwd' => $pwdCount,
                    'pregnant' => $pregnantCount,
                    'infants' => $infantsCount,
                ]);
            }

            return $this->respondSuccess($data);
        });
    }

    public function recentActivities()
    {
        // Check if audit_logs table exists and has data
        try {
            $activities = DB::table('audit_logs')
                ->select('action', 'table_name', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($activity) {
                    return [
                        'action' => $activity->action,
                        'table' => $activity->table_name,
                        'timestamp' => $activity->created_at,
                        'description' => ucfirst($activity->action) . ' ' . $activity->table_name,
                    ];
                });
        } catch (\Exception $e) {
            // Mock data if audit_logs table doesn't exist
            $activities = collect([
                [
                    'action' => 'created',
                    'table' => 'households',
                    'timestamp' => now()->subMinutes(5)->toISOString(),
                    'description' => 'New household registered',
                ],
                [
                    'action' => 'updated',
                    'table' => 'residents',
                    'timestamp' => now()->subMinutes(15)->toISOString(),
                    'description' => 'Resident information updated',
                ],
                [
                    'action' => 'created',
                    'table' => 'puroks',
                    'timestamp' => now()->subMinutes(30)->toISOString(),
                    'description' => 'New purok added',
                ],
                [
                    'action' => 'deleted',
                    'table' => 'households',
                    'timestamp' => now()->subHour()->toISOString(),
                    'description' => 'Household record removed',
                ],
                [
                    'action' => 'created',
                    'table' => 'residents',
                    'timestamp' => now()->subHours(2)->toISOString(),
                    'description' => 'New resident registered',
                ],
            ]);
        }

        return $this->respondSuccess($activities);
    }

    public function upcomingEvents()
    {
        // Get real upcoming events from database
        $events = \App\Models\Event::upcoming()
            ->orderByDate()
            ->limit(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->date->format('Y-m-d'),
                    'location' => $event->location,
                    'description' => $event->description,
                ];
            });

        return $this->respondSuccess($events);
    }

    public function vaccinationSummary()
    {
        $user = request()->user();

        // Create cache key based on user role and purok
        $cacheKey = 'dashboard_vaccination_summary_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');

        return Cache::remember($cacheKey, 600, function () use ($user) { // 10 minutes cache
            // Apply role-based filtering
            $vaccinationQuery = Vaccination::query();

            if ($user->isPurokLeader()) {
                $vaccinationQuery->whereHas('resident.household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
            }

            $data = [
                'completed' => $vaccinationQuery->clone()->where('status', 'Completed')->count(),
                'pending' => $vaccinationQuery->clone()->where('status', 'Pending')->count(),
                'scheduled' => $vaccinationQuery->clone()->where('status', 'Scheduled')->count(),
                'total' => $vaccinationQuery->clone()->count(),
            ];

            return $this->respondSuccess($data);
        });
    }

    public function blotterSummary()
    {
        $user = request()->user();
        $now = Carbon::now();

        // Create cache key based on user role and purok
        $cacheKey = 'dashboard_blotter_summary_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');

        return Cache::remember($cacheKey, 600, function () use ($user, $now) { // 10 minutes cache
            // Apply role-based filtering
            $blotterQuery = Blotter::query();

            if ($user->isPurokLeader()) {
                // For purok leaders, filter blotters by complainant/respondent purok
                $blotterQuery->where(function ($q) use ($user) {
                    $q->whereHas('complainant.household', function ($subQ) use ($user) {
                        $subQ->where('purok_id', $user->assigned_purok_id);
                    })->orWhereHas('respondent.household', function ($subQ) use ($user) {
                        $subQ->where('purok_id', $user->assigned_purok_id);
                    });
                });
            }

            $activeBlotters = $blotterQuery->clone()
                ->whereIn('status', ['Open', 'Ongoing'])
                ->count();

            $resolvedThisMonth = $blotterQuery->clone()
                ->where('status', 'Resolved')
                ->whereMonth('updated_at', $now->month)
                ->whereYear('updated_at', $now->year)
                ->count();

            // Get monthly trend data (last 6 months)
            $monthlyTrend = collect();
            for ($i = 5; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);

                $openCount = $blotterQuery->clone()
                    ->where('status', 'Open')
                    ->whereMonth('created_at', $month->month)
                    ->whereYear('created_at', $month->year)
                    ->count();

                $ongoingCount = $blotterQuery->clone()
                    ->where('status', 'Ongoing')
                    ->whereMonth('created_at', $month->month)
                    ->whereYear('created_at', $month->year)
                    ->count();

                $resolvedCount = $blotterQuery->clone()
                    ->where('status', 'Resolved')
                    ->whereMonth('updated_at', $month->month)
                    ->whereYear('updated_at', $month->year)
                    ->count();

                $monthlyTrend->push([
                    'month' => $month->format('M'),
                    'open' => $openCount,
                    'ongoing' => $ongoingCount,
                    'resolved' => $resolvedCount,
                ]);
            }

            $data = [
                'active' => $activeBlotters,
                'resolvedThisMonth' => $resolvedThisMonth,
                'monthlyTrend' => $monthlyTrend,
            ];

            return $this->respondSuccess($data);
        });
    }

    public function ageDistribution()
    {
        $user = request()->user();
        $now = Carbon::now();

        // Create cache key based on user role and purok
        $cacheKey = 'dashboard_age_distribution_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');

        // Check total residents count to determine if caching is needed
        $residentCountQuery = Resident::query();
        if ($user->isPurokLeader() && $user->assigned_purok_id) {
            $residentCountQuery->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }
        $totalResidents = $residentCountQuery->count();

        // Cache for 10 minutes if residents > 5000, otherwise 5 minutes
        $cacheTime = $totalResidents > 5000 ? 600 : 300;

        return Cache::remember($cacheKey, $cacheTime, function () use ($user, $now) {
            // Apply role-based filtering
            $residentQuery = Resident::query()
                ->whereNotNull('birthdate'); // Exclude residents with missing DOB

            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $residentQuery->whereHas('household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
            }

            // Get all residents with birthdate
            $residents = $residentQuery->get(['id', 'birthdate']);

            // Initialize age groups
            $ageGroups = [
                '0-1' => 0,
                '1-3' => 0,
                '4-5' => 0,
                '6-11' => 0,
                '12-17' => 0,
                '18-25' => 0,
                '26-39' => 0,
                '40-59' => 0,
                '60+' => 0,
            ];

            // Calculate age and assign to groups
            foreach ($residents as $resident) {
                if (!$resident->birthdate) {
                    continue; // Skip if birthdate is null (shouldn't happen due to query, but safety check)
                }

                $birthdate = Carbon::parse($resident->birthdate);
                $age = $now->diffInYears($birthdate);

                // Handle boundary cases: assign to defined bracket
                if ($age == 0) {
                    $ageGroups['0-1']++;
                } elseif ($age >= 1 && $age <= 3) {
                    $ageGroups['1-3']++;
                } elseif ($age >= 4 && $age <= 5) {
                    $ageGroups['4-5']++;
                } elseif ($age >= 6 && $age <= 11) {
                    $ageGroups['6-11']++;
                } elseif ($age >= 12 && $age <= 17) {
                    $ageGroups['12-17']++;
                } elseif ($age >= 18 && $age <= 25) {
                    $ageGroups['18-25']++;
                } elseif ($age >= 26 && $age <= 39) {
                    $ageGroups['26-39']++;
                } elseif ($age >= 40 && $age <= 59) {
                    $ageGroups['40-59']++;
                } else {
                    $ageGroups['60+']++;
                }
            }

            // Age group labels mapping
            $ageGroupLabels = [
                '0-1' => 'Infant',
                '1-3' => 'Toddler',
                '4-5' => 'Preschooler',
                '6-11' => 'Grade Schooler',
                '12-17' => 'Teenager',
                '18-25' => 'Young Adult',
                '26-39' => 'Adult',
                '40-59' => 'Middle-Aged Adult',
                '60+' => 'Senior',
            ];

            // Transform to array format with labels
            $data = collect($ageGroups)->map(function ($count, $ageGroup) use ($ageGroupLabels) {
                return [
                    'age_group' => $ageGroup,
                    'label' => $ageGroupLabels[$ageGroup] ?? $ageGroup,
                    'count' => $count,
                ];
            })->values();

            return $this->respondSuccess($data);
        });
    }

    public function beneficiaries()
    {
        $user = request()->user();
        $now = Carbon::now();

        // Create cache key based on user role and purok
        $cacheKey = 'dashboard_beneficiaries_' . $user->id . '_' . ($user->assigned_purok_id ?? 'admin');

        return Cache::remember($cacheKey, 300, function () use ($user, $now) { // 5 minutes cache
            // Apply role-based filtering
            $residentQuery = Resident::query();
            $householdQuery = Household::query();

            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $residentQuery->whereHas('household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
                $householdQuery->where('purok_id', $user->assigned_purok_id);
            }

            // 4Ps Beneficiaries: Count distinct households with active 4Ps status
            $fourPsQuery = FourPsBeneficiary::query()
                ->where('status', 'active');
            
            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $fourPsQuery->whereHas('household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
            }
            $fourPsCount = $fourPsQuery->count();

            // Senior Citizens: Age >= 60
            $seniorsCount = $residentQuery->clone()
                ->whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())
                ->count();

            // PWD: is_pwd = true
            $pwdCount = $residentQuery->clone()
                ->where('is_pwd', true)
                ->count();

            // Solo Parents: Count Active solo parents from SoloParent model
            $soloParentQuery = SoloParent::query()
                ->with(['resident.household'])
                ->whereDate('valid_until', '>=', $now->toDateString())
                ->whereHas('resident', function ($q) {
                    $q->where('civil_status', '!=', 'married');
                });
            
            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $soloParentQuery->whereHas('resident.household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
            }
            
            // Filter to only those with eligible dependent children (Active status)
            $soloParentCount = $soloParentQuery->get()->filter(function ($soloParent) {
                return $soloParent->hasEligibleDependentChildren() && $soloParent->computed_status === 'active';
            })->count();

            // Calculate total (sum of all categories)
            // Note: A resident can belong to multiple categories, so total may be less than sum
            // We'll return the sum as the total for display purposes
            $total = $fourPsCount + $soloParentCount + $seniorsCount + $pwdCount;

            $categories = [
                [
                    'name' => '4Ps',
                    'count' => $fourPsCount,
                ],
                [
                    'name' => 'Solo Parent',
                    'count' => $soloParentCount,
                ],
                [
                    'name' => 'Senior Citizens',
                    'count' => $seniorsCount,
                ],
                [
                    'name' => 'PWD',
                    'count' => $pwdCount,
                ],
            ];

            $data = [
                'total' => $total,
                'categories' => $categories,
            ];

            return $this->respondSuccess($data);
        });
    }
}
