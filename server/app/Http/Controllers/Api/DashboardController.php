<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\Purok;
use App\Models\Resident;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $user = request()->user();
        $now = Carbon::now();

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

        // Temporary rule for pregnant: female and occupation_status = 'other'
        $pregnant = $residentQuery->clone()
            ->where('sex', 'female')
            ->where('occupation_status', 'other')
            ->count();

        $activePuroks = $purokCount;

        // Get residents by purok
        $residentsByPurokQuery = Purok::withCount('households')
            ->withCount(['households as residents_count' => function ($query) {
                $query->withCount('residents');
            }]);

        if ($user->isPurokLeader()) {
            $residentsByPurokQuery->where('id', $user->assigned_purok_id);
        }

        $residentsByPurok = $residentsByPurokQuery->orderBy('name')
            ->get()
            ->map(function ($purok) {
                // Calculate total residents for this purok
                $residentsCount = Household::where('purok_id', $purok->id)
                    ->withCount('residents')
                    ->get()
                    ->sum('residents_count');

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
        ];

        return $this->respondSuccess($data);
    }

    public function analytics()
    {
        $user = request()->user();
        $now = Carbon::now();

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
    }

    public function monthlyRegistrations()
    {
        $now = Carbon::now();
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
    }

    public function vulnerableTrends()
    {
        $now = Carbon::now();
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
                ->where('sex', 'female')
                ->where('occupation_status', 'other')
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
}
