<?php

namespace App\Http\Controllers;

use App\Models\Purok;
use App\Models\Resident;
use App\Models\Household;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get households report with filters
     */
    public function households(Request $request): JsonResponse
    {
        $query = Household::with(['purok', 'residents']);

        // Apply filters
        if ($request->filled('purok_id')) {
            $query->where('purok_id', $request->purok_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $households = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        // Add member count to each household
        $households->getCollection()->transform(function ($household) {
            $household->member_count = $household->residents->count();
            return $household;
        });

        return response()->json([
            'success' => true,
            'data' => $households,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Get residents report with filters
     */
    public function residents(Request $request): JsonResponse
    {
        $query = Resident::with(['household.purok'])
            ->select([
                'residents.id',
                'residents.household_id',
                'residents.first_name',
                'residents.middle_name',
                'residents.last_name',
                'residents.sex',
                'residents.birthdate',
                'residents.relationship_to_head',
                'residents.occupation_status',
                'residents.is_pwd',
                'residents.created_at',
                'residents.updated_at'
            ])
            ->selectRaw('puroks.name as purok_name');

        // Apply filters
        if ($request->filled('purok_id')) {
            $query->whereHas('household', function ($q) use ($request) {
                $q->where('purok_id', $request->purok_id);
            });
        }

        if ($request->filled('sex')) {
            $query->where('sex', $request->sex);
        }

        if ($request->filled('vulnerabilities')) {
            $vulnerabilities = explode(',', $request->vulnerabilities);
            foreach ($vulnerabilities as $vulnerability) {
                switch (trim($vulnerability)) {
                    case 'seniors':
                        $query->seniors();
                        break;
                    case 'children':
                        $query->children();
                        break;
                    case 'pwds':
                        $query->pwds();
                        break;
                }
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $residents = $query->leftJoin('households', 'residents.household_id', '=', 'households.id')
            ->leftJoin('puroks', 'households.purok_id', '=', 'puroks.id')
            ->orderBy('residents.created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $residents,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Get puroks summary report
     */
    public function puroks(Request $request): JsonResponse
    {
        $puroks = Purok::withCount(['households', 'residents'])
            ->with(['households.residents'])
            ->get()
            ->map(function ($purok) {
                $residents = $purok->households->flatMap->residents;

                return [
                    'id' => $purok->id,
                    'name' => $purok->name,
                    'captain' => $purok->captain,
                    'contact' => $purok->contact,
                    'household_count' => $purok->households_count,
                    'resident_count' => $purok->residents_count,
                    'male_count' => $residents->where('sex', 'Male')->count(),
                    'female_count' => $residents->where('sex', 'Female')->count(),
                    'senior_count' => $residents->filter(function ($resident) {
                        return $resident->getAgeAttribute() >= 60;
                    })->count(),
                    'child_count' => $residents->filter(function ($resident) {
                        return $resident->getAgeAttribute() < 18;
                    })->count(),
                    'pwd_count' => $residents->where('is_pwd', true)->count(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $puroks,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Export reports to PDF or Excel
     */
    public function export(Request $request): JsonResponse
    {
        $type = $request->string('type')->toString();
        $reportType = $request->string('reportType')->toString();
        $filters = $request->except(['type', 'reportType']);

        if (!in_array($type, ['pdf', 'excel'])) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unsupported export type',
                'errors' => ['type' => ['Only PDF and Excel exports are supported']],
            ], 422);
        }

        try {
            $data = $this->getReportData($reportType, $filters);

            if ($type === 'pdf') {
                return $this->exportToPdf($reportType, $data);
            } else {
                return $this->exportToExcel($reportType, $data);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Export failed: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }

    /**
     * Get report data based on type and filters
     */
    private function getReportData(string $reportType, array $filters): array
    {
        switch ($reportType) {
            case 'households':
                return $this->getHouseholdsData($filters);
            case 'residents':
                return $this->getResidentsData($filters);
            case 'puroks':
                return $this->getPuroksData($filters);
            default:
                throw new \InvalidArgumentException('Invalid report type');
        }
    }

    /**
     * Get households data for export
     */
    private function getHouseholdsData(array $filters): array
    {
        $query = Household::with(['purok', 'residents']);

        if (isset($filters['purok_id'])) {
            $query->where('purok_id', $filters['purok_id']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $households = $query->orderBy('created_at', 'desc')->get();

        // Add member count to each household
        return $households->map(function ($household) {
            $data = $household->toArray();
            $data['member_count'] = $household->residents->count();
            return $data;
        })->toArray();
    }

    /**
     * Get residents data for export
     */
    private function getResidentsData(array $filters): array
    {
        $query = Resident::with(['household.purok'])
            ->select([
                'residents.id',
                'residents.household_id',
                'residents.first_name',
                'residents.middle_name',
                'residents.last_name',
                'residents.sex',
                'residents.birthdate',
                'residents.relationship_to_head',
                'residents.occupation_status',
                'residents.is_pwd',
                'residents.created_at',
                'residents.updated_at'
            ]);

        if (isset($filters['purok_id'])) {
            $query->whereHas('household', function ($q) use ($filters) {
                $q->where('purok_id', $filters['purok_id']);
            });
        }

        if (isset($filters['sex'])) {
            $query->where('sex', $filters['sex']);
        }

        if (isset($filters['vulnerabilities'])) {
            $vulnerabilities = explode(',', $filters['vulnerabilities']);
            foreach ($vulnerabilities as $vulnerability) {
                switch (trim($vulnerability)) {
                    case 'seniors':
                        $query->seniors();
                        break;
                    case 'children':
                        $query->children();
                        break;
                    case 'pwds':
                        $query->pwds();
                        break;
                }
            }
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->get()->toArray();
    }

    /**
     * Get puroks data for export
     */
    private function getPuroksData(array $filters): array
    {
        return Purok::withCount(['households', 'residents'])
            ->with(['households.residents'])
            ->get()
            ->map(function ($purok) {
                $residents = $purok->households->flatMap->residents;

                return [
                    'id' => $purok->id,
                    'name' => $purok->name,
                    'captain' => $purok->captain,
                    'contact' => $purok->contact,
                    'household_count' => $purok->households_count,
                    'resident_count' => $purok->residents_count,
                    'male_count' => $residents->where('sex', 'Male')->count(),
                    'female_count' => $residents->where('sex', 'Female')->count(),
                    'senior_count' => $residents->filter(function ($resident) {
                        return $resident->getAgeAttribute() >= 60;
                    })->count(),
                    'child_count' => $residents->filter(function ($resident) {
                        return $resident->getAgeAttribute() < 18;
                    })->count(),
                    'pwd_count' => $residents->where('is_pwd', true)->count(),
                ];
            })
            ->toArray();
    }

    /**
     * Export to PDF (placeholder - implement with DomPDF)
     */
    private function exportToPdf(string $reportType, array $data): JsonResponse
    {
        // TODO: Implement PDF export using DomPDF
        // For now, return a placeholder response
        return response()->json([
            'success' => true,
            'data' => [
                'type' => 'pdf',
                'reportType' => $reportType,
                'status' => 'queued',
                'message' => 'PDF export is being prepared. This feature will be implemented with DomPDF.',
            ],
            'message' => 'PDF export queued successfully',
            'errors' => null,
        ]);
    }

    /**
     * Export to Excel (placeholder - implement with Laravel Excel)
     */
    private function exportToExcel(string $reportType, array $data): JsonResponse
    {
        // TODO: Implement Excel export using Laravel Excel
        // For now, return a placeholder response
        return response()->json([
            'success' => true,
            'data' => [
                'type' => 'excel',
                'reportType' => $reportType,
                'status' => 'queued',
                'message' => 'Excel export is being prepared. This feature will be implemented with Laravel Excel.',
            ],
            'message' => 'Excel export queued successfully',
            'errors' => null,
        ]);
    }

    // Legacy methods for backward compatibility
    public function populationSummary(Request $request)
    {
        $perPurok = Resident::query()
            ->selectRaw('puroks.id as purok_id, puroks.name as purok_name, COUNT(residents.id) as total')
            ->leftJoin('households', 'households.id', '=', 'residents.household_id')
            ->leftJoin('puroks', 'puroks.id', '=', 'households.purok_id')
            ->groupBy('puroks.id', 'puroks.name')
            ->orderBy('puroks.name')
            ->get();

        $bySex = Resident::query()
            ->selectRaw('sex, COUNT(*) as total')
            ->groupBy('sex')
            ->get();

        $now = now();
        $ageBuckets = [
            'children' => Resident::whereDate('birthdate', '>', $now->copy()->subYears(18)->toDateString())->count(),
            'adults' => Resident::whereDate('birthdate', '<=', $now->copy()->subYears(18)->toDateString())
                ->whereDate('birthdate', '>', $now->copy()->subYears(60)->toDateString())->count(),
            'seniors' => Resident::whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'per_purok' => $perPurok,
                'by_sex' => $bySex,
                'by_age' => $ageBuckets,
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    public function vulnerableGroups(Request $request)
    {
        $seniors = Resident::seniors()->count();
        $children = Resident::children()->count();
        $pwds = Resident::pwds()->count();
        $pregnant = 0; // Placeholder; no pregnancy field provided

        return response()->json([
            'success' => true,
            'data' => compact('seniors', 'children', 'pwds', 'pregnant'),
            'message' => null,
            'errors' => null,
        ]);
    }
}
