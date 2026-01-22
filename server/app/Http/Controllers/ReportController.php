<?php

namespace App\Http\Controllers;

use App\Models\Purok;
use App\Models\Resident;
use App\Models\Household;
use App\Models\SoloParent;
use App\Models\FourPsBeneficiary;
use App\Services\PdfService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected $pdfService;

    public function __construct(PdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }
    /**
     * Get households report with filters
     * Sorted alphabetically by head of household name
     */
    public function households(Request $request): JsonResponse
    {
        // Load headResident relationship for sorting and display
        $query = Household::with(['purok', 'residents', 'headResident']);

        // Apply filters
        if ($request->filled('purok_id')) {
            $query->where('purok_id', $request->purok_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('households.created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('households.created_at', '<=', $request->date_to);
        }

        // Sort alphabetically by head of household name
        // Join with residents table to sort by last name, then first name
        $query->leftJoin('residents as head_resident_sort', function ($join) {
            $join->on('households.head_resident_id', '=', 'head_resident_sort.id');
        })
            ->select('households.*')
            ->orderByRaw('COALESCE(head_resident_sort.last_name, households.head_name, "") ASC')
            ->orderByRaw('COALESCE(head_resident_sort.first_name, "") ASC')
            ->orderByRaw('COALESCE(head_resident_sort.middle_name, "") ASC')
            ->groupBy('households.id'); // Group by to avoid duplicate rows from join

        $households = $query->paginate($request->get('per_page', 15));

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

        // Sort alphabetically by last name, then first name
        $residents = $query->leftJoin('households', 'residents.household_id', '=', 'households.id')
            ->leftJoin('puroks', 'households.purok_id', '=', 'puroks.id')
            ->orderBy('residents.last_name', 'asc')
            ->orderBy('residents.first_name', 'asc')
            ->orderBy('residents.middle_name', 'asc')
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
        $user = $request->user();

        // Apply role-based filtering
        $purokQuery = Purok::query();

        // For purok leaders, only show their assigned purok
        if ($user && $user->isPurokLeader() && $user->assigned_purok_id) {
            $purokQuery->where('id', $user->assigned_purok_id);
        }

        $puroks = $purokQuery->get()
            ->map(function ($purok) {
                // Get only non-deleted households
                $households = \App\Models\Household::where('purok_id', $purok->id)
                    ->withoutTrashed()
                    ->get();

                // Get only non-deleted residents from non-deleted households
                $residents = \App\Models\Resident::whereIn('household_id', $households->pluck('id'))
                    ->withoutTrashed()
                    ->get();

                // Calculate counts
                $householdCount = $households->count();
                $residentCount = $residents->count();

                return [
                    'id' => $purok->id,
                    'name' => $purok->name,
                    'captain' => $purok->captain,
                    'contact' => $purok->contact,
                    'household_count' => $householdCount,
                    'resident_count' => $residentCount,
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
            ->sortBy('name') // Sort alphabetically by purok name
            ->values();

        return response()->json([
            'success' => true,
            'data' => $puroks,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Export reports to PDF
     */
    public function export(Request $request)
    {
        $type = $request->string('type')->toString();
        $reportType = $request->string('reportType')->toString();
        $filters = $request->except(['type', 'reportType']);

        if ($type !== 'pdf') {
            return $this->respondError('Unsupported export type', ['type' => ['Only PDF exports are supported']], 422);
        }

        try {
            $data = $this->getReportData($reportType, $filters);
            return $this->exportToPdf($reportType, $data);
        } catch (\Exception $e) {
            return $this->respondError('Export failed: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Get report data based on type and filters
     */
    private function getReportData(string $reportType, array $filters): mixed
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
    private function getHouseholdsData(array $filters): \Illuminate\Database\Eloquent\Collection
    {
        $query = Household::with(['purok', 'residents', 'headResident']);

        if (isset($filters['purok_id'])) {
            $query->where('purok_id', $filters['purok_id']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get residents data for export
     */
    private function getResidentsData(array $filters): \Illuminate\Database\Eloquent\Collection
    {
        $query = Resident::with(['household.purok']);

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

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get puroks data for export
     */
    private function getPuroksData(array $filters): array
    {
        $puroks = Purok::withCount(['households', 'residents'])
            ->with(['households.residents'])
            ->get();

        return $puroks->map(function ($purok) {
            $residents = $purok->households->flatMap->residents;

            return [
                'id' => $purok->id,
                'name' => $purok->name,
                'captain' => $purok->captain ?? 'N/A',
                'contact' => $purok->contact ?? 'N/A',
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
        })->toArray();
    }

    /**
     * Export to PDF using PdfService
     * @return Response|JsonResponse
     */
    private function exportToPdf(string $reportType, mixed $data)
    {
        try {
            $viewMap = [
                'households' => 'pdf.reports.households',
                'residents' => 'pdf.reports.residents',
                'puroks' => 'pdf.reports.puroks',
            ];

            if (!isset($viewMap[$reportType])) {
                throw new \InvalidArgumentException("Invalid report type: {$reportType}");
            }

            $user = Auth::user();
            $pdfData = [];

            switch ($reportType) {
                case 'households':
                    $pdfData = [
                        'title' => 'Households Report',
                        'document_title' => 'HOUSEHOLD MASTERLIST REPORT',
                        'households' => $data, // Already a collection
                        'generated_by' => $user?->name ?? 'System',
                    ];
                    break;
                case 'residents':
                    $pdfData = [
                        'title' => 'Residents Report',
                        'document_title' => 'RESIDENTS REPORT',
                        'residents' => $data, // Already a collection
                        'filters' => ['purok' => 'All', 'search' => 'None'],
                    ];
                    break;
                case 'puroks':
                    $pdfData = [
                        'title' => 'Puroks Summary',
                        'document_title' => 'PUROKS SUMMARY REPORT',
                        'puroks' => $data, // Already an array
                        'totals' => [
                            'households' => array_sum(array_column($data, 'household_count')),
                            'residents' => array_sum(array_column($data, 'resident_count')),
                            'males' => array_sum(array_column($data, 'male_count')),
                            'females' => array_sum(array_column($data, 'female_count')),
                            'seniors' => array_sum(array_column($data, 'senior_count')),
                            'children' => array_sum(array_column($data, 'child_count')),
                            'pwds' => array_sum(array_column($data, 'pwd_count')),
                        ],
                    ];
                    break;
            }

            $filename = $reportType . '-report-' . date('Y-m-d') . '.pdf';
            return $this->pdfService->download($viewMap[$reportType], $pdfData, $filename);
        } catch (\Exception $e) {
            Log::error("PDF export failed for {$reportType}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export households report to CSV
     * Returns Excel-compatible CSV with UTF-8 encoding
     *
     * This is a production-grade export for official barangay masterlists.
     *
     * @param Request $request
     * @return StreamedResponse|JsonResponse
     */
    public function exportHouseholdsCsv(Request $request)
    {
        try {
            // STEP 1: Extract and validate filters
            $filters = $request->only(['purok_id', 'date_from', 'date_to', 'search']);

            // STEP 2: Build query with proper eager loading
            // Load all necessary relations in a single query to avoid N+1 problems
            $query = Household::with([
                'purok', // BelongsTo - may be null
                'headResident', // BelongsTo - may be null (fallback to head_name)
                'residents' => function ($q) {
                    // Load residents with solo parent relationship
                    // Order by last name, then first name for consistent output
                    $q->with('soloParent')
                        ->orderBy('last_name', 'asc')
                        ->orderBy('first_name', 'asc');
                },
                'fourPsBeneficiaries' => function ($q) {
                    // Only load active 4Ps beneficiaries
                    $q->where('status', 'active');
                }
            ]);

            // STEP 3: Apply filters (same logic as households() method)
            if (!empty($filters['purok_id'])) {
                $query->where('purok_id', $filters['purok_id']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            if (!empty($filters['search'])) {
                $query->search($filters['search']);
            }

            // STEP 4: Execute query
            $households = $query->get();

            // STEP 5: Sort households alphabetically by head of household name
            // Convert to array, sort, then convert back to collection to ensure proper sorting
            $householdsArray = $households->all();
            usort($householdsArray, function ($a, $b) {
                $headA = $this->getHeadInfo($a);
                $headB = $this->getHeadInfo($b);

                $nameA = $this->getSortableHeadName($a, $headA);
                $nameB = $this->getSortableHeadName($b, $headB);

                // Compare by last name first, then full name (case-insensitive)
                return strcasecmp($nameA, $nameB);
            });
            $households = collect($householdsArray);

            Log::info('CSV export initiated', [
                'household_count' => $households->count(),
                'filters' => $filters
            ]);

            // STEP 6: Generate filename
            $filename = 'household_report_' . date('Y-m-d') . '.csv';

            // STEP 7: Stream CSV response
            return response()->streamDownload(function () use ($households) {
                $this->generateCsvContent($households);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Pragma' => 'public'
            ]);
        } catch (\Exception $e) {
            Log::error('CSV export failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'filters' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate CSV: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export residents report to CSV
     * Returns Excel-compatible CSV with UTF-8 encoding
     *
     * This is a production-grade export for official barangay masterlists.
     *
     * @param Request $request
     * @return StreamedResponse|JsonResponse
     */
    public function exportResidentsCsv(Request $request)
    {
        try {
            // STEP 1: Extract and validate filters
            $filters = $request->only(['purok_id', 'date_from', 'date_to', 'sex', 'vulnerabilities', 'search']);

            // STEP 2: Build query with proper eager loading
            $query = Resident::with(['household.purok']);

            // STEP 3: Apply filters (same logic as residents() method)
            if (!empty($filters['purok_id'])) {
                $query->whereHas('household', function ($q) use ($filters) {
                    $q->where('purok_id', $filters['purok_id']);
                });
            }

            if (!empty($filters['sex'])) {
                $query->where('sex', $filters['sex']);
            }

            if (!empty($filters['vulnerabilities'])) {
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

            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            if (!empty($filters['search'])) {
                $query->search($filters['search']);
            }

            // STEP 4: Execute query and sort alphabetically
            $residents = $query->leftJoin('households', 'residents.household_id', '=', 'households.id')
                ->leftJoin('puroks', 'households.purok_id', '=', 'puroks.id')
                ->select('residents.*', 'puroks.name as purok_name')
                ->orderBy('residents.last_name', 'asc')
                ->orderBy('residents.first_name', 'asc')
                ->orderBy('residents.middle_name', 'asc')
                ->get();

            Log::info('CSV export initiated', [
                'resident_count' => $residents->count(),
                'filters' => $filters
            ]);

            // STEP 5: Generate filename
            $filename = 'residents_report_' . date('Y-m-d') . '.csv';

            // STEP 6: Stream CSV response
            return response()->streamDownload(function () use ($residents) {
                $this->generateResidentsCsvContent($residents);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Pragma' => 'public'
            ]);
        } catch (\Exception $e) {
            Log::error('CSV export failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'filters' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate CSV: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate CSV content from residents collection
     * All values are properly quoted for Excel compatibility
     *
     * @param \Illuminate\Database\Eloquent\Collection $residents
     * @return void
     */
    private function generateResidentsCsvContent($residents): void
    {
        $handle = fopen('php://output', 'w');

        if ($handle === false) {
            throw new \Exception('Failed to open output stream for CSV generation');
        }

        try {
            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Write CSV headers - first row must be headers
            $headers = [
                'No',
                'Resident ID',
                'Last Name',
                'First Name',
                'Middle Name',
                'Suffix',
                'Full Name',
                'Sex',
                'Age',
                'Birthdate',
                'Civil Status',
                'Relationship to Head',
                'Occupation Status',
                'Purok',
                'Household Address',
                'Head of Household',
                'PWD',
                'Senior Citizen',
                'Child',
                'Contact Number',
                'Date Registered',
                'Last Updated'
            ];
            $this->writeCsvRow($handle, $headers);

            // Process each resident
            $rowNumber = 1;
            foreach ($residents as $resident) {
                $row = $this->buildResidentRow($resident, $rowNumber++);
                $this->writeCsvRow($handle, $row);
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Build a single CSV row for a resident
     *
     * @param Resident $resident
     * @param int $rowNumber
     * @return array
     */
    private function buildResidentRow($resident, int $rowNumber): array
    {
        // Build full name
        $fullName = trim(($resident->last_name ?? '') . ', ' . ($resident->first_name ?? '') . ' ' . ($resident->middle_name ?? '') . ' ' . ($resident->suffix ?? ''));
        $fullName = trim($fullName) ?: 'N/A';

        // Calculate age
        $age = 'N/A';
        if ($resident->birthdate) {
            try {
                $age = (string) Carbon::parse($resident->birthdate)->age;
            } catch (\Exception $e) {
                $age = 'N/A';
            }
        }

        // Format birthdate
        $birthdate = $this->formatDate($resident->birthdate);

        // Get purok name
        $purokName = 'N/A';
        if ($resident->household && $resident->household->purok) {
            $purokName = $resident->household->purok->name ?? 'N/A';
        } elseif (isset($resident->purok_name)) {
            $purokName = $resident->purok_name;
        }

        // Get household address
        $householdAddress = 'N/A';
        if ($resident->household) {
            $householdAddress = $resident->household->address ?? 'N/A';
        }

        // Get head of household name
        $headName = 'N/A';
        if ($resident->household) {
            if ($resident->household->headResident) {
                $head = $resident->household->headResident;
                $headName = trim(($head->last_name ?? '') . ', ' . ($head->first_name ?? '') . ' ' . ($head->middle_name ?? '') . ' ' . ($head->suffix ?? ''));
                $headName = trim($headName) ?: 'N/A';
            } elseif ($resident->household->head_name) {
                $headName = $resident->household->head_name;
            }
        }

        // Check classifications
        $isPwd = $resident->is_pwd ? 'Yes' : 'No';
        $isSenior = 'No';
        $isChild = 'No';
        if ($resident->birthdate) {
            try {
                $residentAge = Carbon::parse($resident->birthdate)->age;
                $isSenior = $residentAge >= 60 ? 'Yes' : 'No';
                $isChild = $residentAge < 18 ? 'Yes' : 'No';
            } catch (\Exception $e) {
                // Keep defaults
            }
        }

        // Format dates
        $createdDate = $this->formatDate($resident->created_at);
        $updatedDate = $this->formatDate($resident->updated_at);

        // Build row array
        return [
            (string) $rowNumber,
            (string) $resident->id,
            $resident->last_name ?? 'N/A',
            $resident->first_name ?? 'N/A',
            $resident->middle_name ?? 'N/A',
            $resident->suffix ?? 'N/A',
            $fullName,
            ucfirst(strtolower($resident->sex ?? 'N/A')),
            $age,
            $birthdate,
            ucfirst(strtolower($resident->civil_status ?? 'N/A')),
            ucfirst(strtolower($resident->relationship_to_head ?? 'N/A')),
            ucfirst(strtolower($resident->occupation_status ?? 'N/A')),
            $purokName,
            $householdAddress,
            $headName,
            $isPwd,
            $isSenior,
            $isChild,
            $resident->contact_number ?? 'N/A',
            $createdDate,
            $updatedDate
        ];
    }

    /**
     * Get sortable head name (last name preferred, fallback to full name)
     * Returns normalized name for proper alphabetical sorting
     *
     * @param Household $household
     * @param array $headInfo
     * @return string
     */
    private function getSortableHeadName($household, array $headInfo): string
    {
        // If we have headResident, prefer last name for sorting
        if ($household->headResident && !empty($household->headResident->last_name)) {
            $lastName = trim($household->headResident->last_name);
            $firstName = trim($household->headResident->first_name ?? '');
            $middleName = trim($household->headResident->middle_name ?? '');
            // Return "LastName, FirstName MiddleName" for proper alphabetical sorting
            $name = $lastName;
            if ($firstName || $middleName) {
                $name .= ', ' . trim($firstName . ' ' . $middleName);
            }
            return $name;
        }

        // Fallback to full name or head_name
        $fullName = $headInfo['name'] ?? $household->head_name ?? 'ZZZ';

        // If name contains comma, assume "Last, First" format
        if (strpos($fullName, ',') !== false) {
            return $fullName;
        }

        // Otherwise, try to extract last name if possible
        $parts = array_filter(explode(' ', trim($fullName)));
        if (count($parts) > 1) {
            // Assume last word is last name
            $lastName = array_pop($parts);
            $firstName = implode(' ', $parts);
            return $lastName . ', ' . $firstName;
        }

        return $fullName;
    }

    /**
     * Export puroks report to CSV
     * Returns Excel-compatible CSV with UTF-8 encoding
     *
     * This is a production-grade export for official barangay masterlists.
     *
     * @param Request $request
     * @return StreamedResponse|JsonResponse
     */
    public function exportPuroksCsv(Request $request)
    {
        try {
            $user = $request->user();

            // Apply role-based filtering
            $purokQuery = Purok::query();

            // For purok leaders, only show their assigned purok
            if ($user && $user->isPurokLeader() && $user->assigned_purok_id) {
                $purokQuery->where('id', $user->assigned_purok_id);
            }

            // Get puroks data (same logic as puroks() method)
            $puroks = $purokQuery->get()
                ->map(function ($purok) {
                    // Get only non-deleted households
                    $households = \App\Models\Household::where('purok_id', $purok->id)
                        ->withoutTrashed()
                        ->get();

                    // Get only non-deleted residents from non-deleted households
                    $residents = \App\Models\Resident::whereIn('household_id', $households->pluck('id'))
                        ->withoutTrashed()
                        ->get();

                    // Calculate counts
                    $householdCount = $households->count();
                    $residentCount = $residents->count();

                    return [
                        'id' => $purok->id,
                        'name' => $purok->name,
                        'captain' => $purok->captain,
                        'contact' => $purok->contact,
                        'household_count' => $householdCount,
                        'resident_count' => $residentCount,
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
                ->sortBy('name') // Sort alphabetically by purok name
                ->values();

            Log::info('CSV export initiated', [
                'purok_count' => $puroks->count()
            ]);

            // Generate filename
            $filename = 'puroks_report_' . date('Y-m-d') . '.csv';

            // Stream CSV response
            return response()->streamDownload(function () use ($puroks) {
                $this->generatePuroksCsvContent($puroks);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Pragma' => 'public'
            ]);
        } catch (\Exception $e) {
            Log::error('CSV export failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate CSV: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate CSV content from puroks collection
     * All values are properly quoted for Excel compatibility
     *
     * @param \Illuminate\Support\Collection $puroks
     * @return void
     */
    private function generatePuroksCsvContent($puroks): void
    {
        $handle = fopen('php://output', 'w');

        if ($handle === false) {
            throw new \Exception('Failed to open output stream for CSV generation');
        }

        try {
            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Write CSV headers - first row must be headers
            $headers = [
                'No',
                'Purok ID',
                'Purok Name',
                'Captain',
                'Contact',
                'Household Count',
                'Resident Count',
                'Male Count',
                'Female Count',
                'Senior Count',
                'Child Count',
                'PWD Count'
            ];
            $this->writeCsvRow($handle, $headers);

            // Process each purok
            $rowNumber = 1;
            foreach ($puroks as $purok) {
                $row = $this->buildPurokRow($purok, $rowNumber++);
                $this->writeCsvRow($handle, $row);
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Build a single CSV row for a purok
     *
     * @param array $purok
     * @param int $rowNumber
     * @return array
     */
    private function buildPurokRow(array $purok, int $rowNumber): array
    {
        return [
            (string) $rowNumber,
            (string) $purok['id'],
            $purok['name'] ?? 'N/A',
            $purok['captain'] ?? 'N/A',
            $purok['contact'] ?? 'N/A',
            (string) $purok['household_count'],
            (string) $purok['resident_count'],
            (string) $purok['male_count'],
            (string) $purok['female_count'],
            (string) $purok['senior_count'],
            (string) $purok['child_count'],
            (string) $purok['pwd_count']
        ];
    }

    /**
     * Generate CSV content from households collection
     * All values are properly quoted for Excel compatibility
     *
     * @param \Illuminate\Database\Eloquent\Collection $households
     * @return void
     */
    private function generateCsvContent($households): void
    {
        $handle = fopen('php://output', 'w');

        if ($handle === false) {
            throw new \Exception('Failed to open output stream for CSV generation');
        }

        try {
            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Write CSV headers - first row must be headers, no titles or spacing
            $headers = [
                'No',
                'Household ID',
                'Head Full Name',
                'Sex',
                'Age',
                'Civil Status',
                'Purok',
                'Complete Address',
                'Total Members',
                'Names of Members',
                'Senior Citizens Count',
                'PWD Count',
                'Solo Parent',
                '4Ps Beneficiary',
                'Contact Number',
                'Date Registered',
                'Last Updated'
            ];
            $this->writeCsvRow($handle, $headers);

            // Process each household
            $rowNumber = 1;
            foreach ($households as $household) {
                $row = $this->buildHouseholdRow($household, $rowNumber++);
                $this->writeCsvRow($handle, $row);
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Write a CSV row with all values properly quoted
     * This ensures Excel reads the CSV correctly
     *
     * @param resource $handle
     * @param array $row
     * @return void
     */
    private function writeCsvRow($handle, array $row): void
    {
        $quotedValues = [];
        foreach ($row as $value) {
            $quotedValues[] = $this->quoteCsvValue($value);
        }
        fwrite($handle, implode(',', $quotedValues) . "\r\n");
    }

    /**
     * Quote and escape a CSV value for Excel compatibility
     * ALL values are quoted to prevent Excel from misinterpreting data
     *
     * @param mixed $value
     * @return string
     */
    private function quoteCsvValue($value): string
    {
        // Convert to string and sanitize
        $str = $value === null ? '' : (string) $value;

        // Sanitize line breaks - replace with space to prevent row breaks
        $str = str_replace(["\r\n", "\n", "\r"], ' ', $str);

        // Escape double quotes by doubling them
        $str = str_replace('"', '""', $str);

        // Always wrap in double quotes for Excel compatibility
        return '"' . $str . '"';
    }

    /**
     * Build a single CSV row for a household
     *
     * @param Household $household
     * @param int $rowNumber
     * @return array
     */
    private function buildHouseholdRow($household, int $rowNumber): array
    {
        // Get head information
        $headInfo = $this->getHeadInfo($household);

        // Get purok name
        $purokName = $this->getPurokName($household);

        // Get residents data
        $residentsData = $this->computeHouseholdResidentsData($household);

        // Check for 4Ps beneficiary
        $hasFourPs = $this->hasFourPsBeneficiary($household);

        // Format dates
        $createdDate = $this->formatDate($household->created_at);
        $updatedDate = $this->formatDate($household->updated_at);

        // Build row array - all values will be properly quoted in writeCsvRow
        return [
            (string) $rowNumber,
            (string) $household->id,
            $headInfo['name'],
            $headInfo['sex'],
            $headInfo['age'],
            $headInfo['civil_status'],
            $purokName,
            $household->address ?? 'N/A',
            (string) $residentsData['total_members'],
            $residentsData['member_names'],
            (string) $residentsData['senior_count'],
            (string) $residentsData['pwd_count'],
            $residentsData['has_solo_parent'] ? 'Yes' : 'No',
            $hasFourPs ? 'Yes' : 'No',
            $household->contact ?? 'N/A',
            $createdDate,
            $updatedDate
        ];
    }

    /**
     * Get head of household information
     *
     * @param Household $household
     * @return array{name: string, sex: string, age: string, civil_status: string}
     */
    private function getHeadInfo($household): array
    {
        $default = [
            'name' => 'N/A',
            'sex' => 'N/A',
            'age' => 'N/A',
            'civil_status' => 'N/A'
        ];

        // Try to get from headResident relationship
        if ($household->headResident) {
            $head = $household->headResident;

            // Build full name: "Last, First Middle Suffix"
            $nameParts = [];
            if (!empty($head->last_name)) {
                $nameParts[] = $head->last_name;
            }
            if (!empty($head->first_name) || !empty($head->middle_name) || !empty($head->suffix)) {
                $nameParts[] = ',';
                if (!empty($head->first_name)) {
                    $nameParts[] = $head->first_name;
                }
                if (!empty($head->middle_name)) {
                    $nameParts[] = $head->middle_name;
                }
                if (!empty($head->suffix)) {
                    $nameParts[] = $head->suffix;
                }
            }
            $name = trim(implode(' ', $nameParts)) ?: 'N/A';

            // Get sex
            $sex = !empty($head->sex) ? ucfirst(strtolower($head->sex)) : 'N/A';

            // Calculate age
            $age = 'N/A';
            if ($head->birthdate) {
                try {
                    $age = (string) Carbon::parse($head->birthdate)->age;
                } catch (\Exception $e) {
                    $age = 'N/A';
                }
            }

            // Get civil status
            $civilStatus = !empty($head->civil_status) ? ucfirst(strtolower($head->civil_status)) : 'N/A';

            return [
                'name' => $name,
                'sex' => $sex,
                'age' => $age,
                'civil_status' => $civilStatus
            ];
        }

        // Fallback to head_name field if headResident is not available
        if (!empty($household->head_name)) {
            $default['name'] = $household->head_name;
        }

        return $default;
    }

    /**
     * Get purok name safely
     *
     * @param Household $household
     * @return string
     */
    private function getPurokName($household): string
    {
        if ($household->purok && !empty($household->purok->name)) {
            return $household->purok->name;
        }
        return 'N/A';
    }

    /**
     * Compute residents statistics for a household (for CSV export)
     *
     * @param Household $household
     * @return array{total_members: int, member_names: string, senior_count: int, pwd_count: int, has_solo_parent: bool}
     */
    private function computeHouseholdResidentsData($household): array
    {
        $residents = $household->residents ?? collect();

        // Initialize return values
        $result = [
            'total_members' => 0,
            'member_names' => 'N/A',
            'senior_count' => 0,
            'pwd_count' => 0,
            'has_solo_parent' => false
        ];

        if ($residents->isEmpty()) {
            return $result;
        }

        // Total members
        $result['total_members'] = $residents->count();

        // Build member names list
        $memberNames = [];
        $seniorCount = 0;
        $pwdCount = 0;
        $hasSoloParent = false;

        foreach ($residents as $resident) {
            if (!$resident) {
                continue;
            }

            // Build full name for member list
            $nameParts = [];
            if (!empty($resident->last_name)) {
                $nameParts[] = $resident->last_name;
            }
            if (!empty($resident->first_name) || !empty($resident->middle_name) || !empty($resident->suffix)) {
                $nameParts[] = ',';
                if (!empty($resident->first_name)) {
                    $nameParts[] = $resident->first_name;
                }
                if (!empty($resident->middle_name)) {
                    $nameParts[] = $resident->middle_name;
                }
                if (!empty($resident->suffix)) {
                    $nameParts[] = $resident->suffix;
                }
            }
            $fullName = trim(implode(' ', $nameParts));
            if (!empty($fullName)) {
                $memberNames[] = $fullName;
            }

            // Count seniors (age >= 60)
            if ($resident->birthdate) {
                try {
                    $age = Carbon::parse($resident->birthdate)->age;
                    if ($age >= 60) {
                        $seniorCount++;
                    }
                } catch (\Exception $e) {
                    // Skip if age calculation fails
                }
            }

            // Count PWD
            if ($resident->is_pwd === true) {
                $pwdCount++;
            }

            // Check for solo parent (via relationship)
            if (!$hasSoloParent && $resident->relationLoaded('soloParent')) {
                if ($resident->soloParent !== null) {
                    $hasSoloParent = true;
                }
            }
        }

        $result['member_names'] = !empty($memberNames) ? implode(', ', $memberNames) : 'N/A';
        $result['senior_count'] = $seniorCount;
        $result['pwd_count'] = $pwdCount;
        $result['has_solo_parent'] = $hasSoloParent;

        return $result;
    }

    /**
     * Check if household has active 4Ps beneficiary
     *
     * @param Household $household
     * @return bool
     */
    private function hasFourPsBeneficiary($household): bool
    {
        if ($household->relationLoaded('fourPsBeneficiaries')) {
            return $household->fourPsBeneficiaries->isNotEmpty();
        }

        // Fallback query if relation not loaded
        return FourPsBeneficiary::where('household_id', $household->id)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Format date to YYYY-MM-DD string
     *
     * @param mixed $date
     * @return string
     */
    private function formatDate($date): string
    {
        if (!$date) {
            return 'N/A';
        }

        try {
            if (is_string($date)) {
                return Carbon::parse($date)->format('Y-m-d');
            }

            if (method_exists($date, 'format')) {
                return $date->format('Y-m-d');
            }
        } catch (\Exception $e) {
            // If formatting fails, return N/A
        }

        return 'N/A';
    }

    /**
     * Export solo parents report to CSV
     * Returns Excel-compatible CSV with UTF-8 encoding
     *
     * This is a production-grade export for official barangay masterlists.
     *
     * @param Request $request
     * @return StreamedResponse|JsonResponse
     */
    public function exportSoloParentsCsv(Request $request)
    {
        try {
            $user = $request->user();

            // Build query with proper eager loading
            $query = SoloParent::with(['resident.household.purok', 'creator', 'verifier']);

            // Role-based filtering
            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $query->byPurok($user->assigned_purok_id);
            }

            // Apply filters
            if ($request->filled('search')) {
                $query->search($request->search);
            }

            if ($request->filled('status')) {
                $query->byComputedStatus($request->status);
            }

            if ($user->role === 'admin' && $request->filled('purok_id')) {
                $query->byPurok($request->purok_id);
            }

            // Execute query
            $soloParents = $query->get();

            // Sort alphabetically by resident name (last name, first name)
            $soloParentsArray = $soloParents->all();
            usort($soloParentsArray, function ($a, $b) {
                $nameA = $this->getSoloParentSortableName($a);
                $nameB = $this->getSoloParentSortableName($b);
                return strcasecmp($nameA, $nameB);
            });
            $soloParents = collect($soloParentsArray);

            Log::info('CSV export initiated', [
                'solo_parent_count' => $soloParents->count()
            ]);

            // Generate filename
            $filename = 'solo_parents_report_' . date('Y-m-d') . '.csv';

            // Stream CSV response
            return response()->streamDownload(function () use ($soloParents) {
                $this->generateSoloParentsCsvContent($soloParents);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Pragma' => 'public'
            ]);
        } catch (\Exception $e) {
            Log::error('CSV export failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate CSV: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get sortable name for solo parent (resident's last name, first name)
     *
     * @param SoloParent $soloParent
     * @return string
     */
    private function getSoloParentSortableName($soloParent): string
    {
        if ($soloParent->resident) {
            $lastName = trim($soloParent->resident->last_name ?? '');
            $firstName = trim($soloParent->resident->first_name ?? '');
            $middleName = trim($soloParent->resident->middle_name ?? '');

            $name = $lastName;
            if ($firstName || $middleName) {
                $name .= ', ' . trim($firstName . ' ' . $middleName);
            }
            return $name ?: 'ZZZ';
        }
        return 'ZZZ';
    }

    /**
     * Generate CSV content from solo parents collection
     * All values are properly quoted for Excel compatibility
     *
     * @param \Illuminate\Support\Collection $soloParents
     * @return void
     */
    private function generateSoloParentsCsvContent($soloParents): void
    {
        $handle = fopen('php://output', 'w');

        if ($handle === false) {
            throw new \Exception('Failed to open output stream for CSV generation');
        }

        try {
            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Write CSV headers - first row must be headers
            $headers = [
                'No',
                'Solo Parent ID',
                'Resident ID',
                'Last Name',
                'First Name',
                'Middle Name',
                'Full Name',
                'Sex',
                'Age',
                'Birthdate',
                'Civil Status',
                'Eligibility Reason',
                'Date Declared',
                'Valid Until',
                'Status',
                'Purok',
                'Household Address',
                'Contact Number',
                'Dependent Children Count',
                'Date Registered',
                'Last Updated'
            ];
            $this->writeCsvRow($handle, $headers);

            // Process each solo parent
            $rowNumber = 1;
            foreach ($soloParents as $soloParent) {
                $row = $this->buildSoloParentRow($soloParent, $rowNumber++);
                $this->writeCsvRow($handle, $row);
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Build a single CSV row for a solo parent
     *
     * @param SoloParent $soloParent
     * @param int $rowNumber
     * @return array
     */
    private function buildSoloParentRow($soloParent, int $rowNumber): array
    {
        $resident = $soloParent->resident;

        // Build full name
        $fullName = 'N/A';
        $lastName = 'N/A';
        $firstName = 'N/A';
        $middleName = 'N/A';
        $sex = 'N/A';
        $age = 'N/A';
        $birthdate = 'N/A';
        $civilStatus = 'N/A';

        if ($resident) {
            $lastName = $resident->last_name ?? 'N/A';
            $firstName = $resident->first_name ?? 'N/A';
            $middleName = $resident->middle_name ?? 'N/A';
            $fullName = trim("{$firstName} {$middleName} {$lastName}") ?: 'N/A';
            $sex = ucfirst(strtolower($resident->sex ?? 'N/A'));
            $age = $resident->age ? (string) $resident->age : 'N/A';
            $birthdate = $this->formatDate($resident->birthdate);
            $civilStatus = ucfirst(strtolower($resident->civil_status ?? 'N/A'));
        }

        // Get eligibility reason label
        $eligibilityReason = $soloParent->eligibility_reason_label ?? ucfirst(str_replace('_', ' ', $soloParent->eligibility_reason ?? 'N/A'));

        // Get computed status
        $status = 'N/A';
        try {
            $status = ucfirst($soloParent->computed_status ?? 'N/A');
        } catch (\Exception $e) {
            // Keep default
        }

        // Get purok name
        $purokName = 'N/A';
        if ($resident && $resident->household && $resident->household->purok) {
            $purokName = $resident->household->purok->name ?? 'N/A';
        }

        // Get household address
        $householdAddress = 'N/A';
        if ($resident && $resident->household) {
            $householdAddress = $resident->household->address ?? 'N/A';
        }

        // Get contact number
        $contact = 'N/A';
        if ($resident && $resident->household) {
            $contact = $resident->household->contact ?? 'N/A';
        }

        // Get dependent children count
        $dependentChildrenCount = '0';
        try {
            $dependentChildren = $soloParent->getDependentChildren();
            $dependentChildrenCount = (string) $dependentChildren->count();
        } catch (\Exception $e) {
            // Keep default
        }

        // Format dates
        $dateDeclared = $this->formatDate($soloParent->date_declared);
        $validUntil = $this->formatDate($soloParent->valid_until);
        $createdDate = $this->formatDate($soloParent->created_at);
        $updatedDate = $this->formatDate($soloParent->updated_at);

        // Build row array
        return [
            (string) $rowNumber,
            (string) $soloParent->id,
            (string) ($soloParent->resident_id ?? 'N/A'),
            $lastName,
            $firstName,
            $middleName,
            $fullName,
            $sex,
            $age,
            $birthdate,
            $civilStatus,
            $eligibilityReason,
            $dateDeclared,
            $validUntil,
            $status,
            $purokName,
            $householdAddress,
            $contact,
            $dependentChildrenCount,
            $createdDate,
            $updatedDate
        ];
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
