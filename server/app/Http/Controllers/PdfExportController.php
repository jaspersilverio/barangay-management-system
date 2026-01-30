<?php

namespace App\Http\Controllers;

use App\Services\PdfService;
use App\Exports\VaccinationExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Centralized PDF Export Controller
 *
 * Handles PDF generation for reports and other exportable documents
 * Uses the centralized PdfService for consistent formatting
 */
class PdfExportController extends Controller
{
    protected $pdfService;

    public function __construct(PdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    /**
     * Export residents list as PDF
     */
    public function exportResidents(Request $request)
    {
        // Authorization check
        $user = Auth::user();
        if (!$user || ($user->role !== 'admin' && $user->role !== 'staff' && $user->role !== 'purok_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get residents data (reuse existing query logic)
            $query = \App\Models\Resident::with(['household.purok']);

            // Role-based filtering for purok leaders
            if ($user->role === 'purok_leader' && $user->assigned_purok_id) {
                $query->whereHas('household', function ($q) use ($user) {
                    $q->where('purok_id', $user->assigned_purok_id);
                });
            }

            // Apply filters from request
            if ($request->has('purok_id') && $request->purok_id) {
                $query->whereHas('household', function ($q) use ($request) {
                    $q->where('purok_id', $request->purok_id);
                });
            }

            if ($request->has('gender') && $request->gender) {
                $query->where('sex', $request->gender);
            }

            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Sort alphabetically
            $residents = $query->orderBy('first_name')->orderBy('last_name')->get();

            // Prepare data
            $data = [
                'title' => 'Residents List',
                'document_title' => 'RESIDENTS LIST',
                'residents' => $residents,
                'filters' => [
                    'purok' => $request->purok_id ? \App\Models\Purok::find($request->purok_id)?->name : 'All',
                    'search' => $request->search ?? 'None',
                    'gender' => $request->gender ?? 'All',
                ],
            ];

            $filename = 'residents-list-' . date('Y-m-d') . '.pdf';
            return $this->pdfService->generateReport('pdf.reports.residents', $data, $filename);
        } catch (\Exception $e) {
            Log::error('Residents PDF export failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF'
            ], 500);
        }
    }

    /**
     * Export households list as PDF
     */
    public function exportHouseholds(Request $request)
    {
        // Authorization check
        $user = Auth::user();
        if (!$user || ($user->role !== 'admin' && $user->role !== 'staff' && $user->role !== 'purok_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get households data with residents and related data
            $query = \App\Models\Household::with([
                'purok',
                'residents' => function ($q) {
                    $q->with('soloParent') // Load solo parent relationship for each resident
                        ->orderBy('relationship_to_head')
                        ->orderBy('first_name');
                },
                'headResident',
                'fourPsBeneficiaries' => function ($q) {
                    $q->where('status', 'active'); // Only load active 4Ps beneficiaries
                }
            ]);

            // Role-based filtering for purok leaders
            if ($user->role === 'purok_leader' && $user->assigned_purok_id) {
                $query->where('purok_id', $user->assigned_purok_id);
            }

            // Apply filters
            if ($request->has('purok_id') && $request->purok_id) {
                $query->where('purok_id', $request->purok_id);
            }

            if ($request->has('search') && $request->search) {
                $query->where('head_name', 'like', '%' . $request->search . '%');
            }

            // Sort alphabetically
            $households = $query->orderBy('head_name')->get();

            // Prepare data
            $data = [
                'title' => 'Households List',
                'document_title' => 'HOUSEHOLD MASTERLIST REPORT',
                'households' => $households,
                'filters' => [
                    'purok' => $request->purok_id ? \App\Models\Purok::find($request->purok_id)?->name : 'All',
                    'search' => $request->search ?? 'None',
                ],
                'generated_by' => $user->name ?? 'System',
            ];

            $filename = 'households-list-' . date('Y-m-d') . '.pdf';
            return $this->pdfService->generateReport('pdf.reports.households', $data, $filename);
        } catch (\Exception $e) {
            Log::error('Households PDF export failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF'
            ], 500);
        }
    }

    /**
     * Export blotters list as PDF
     */
    public function exportBlotters(Request $request)
    {
        // Authorization check - allow admin, captain, staff
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get blotters data - start with query() to avoid issues when applying scopes
            $query = \App\Models\Blotter::query()->withoutTrashed();

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->byStatus($request->status);
            }

            if ($request->has('start_date') && $request->start_date) {
                $endDate = $request->end_date ?? date('Y-m-d');
                $query->byDateRange($request->start_date, $endDate);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('case_number', 'like', "%{$search}%")
                        ->orWhere('incident_location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('complainant_full_name', 'like', "%{$search}%")
                        ->orWhere('respondent_full_name', 'like', "%{$search}%")
                        ->orWhereHas('complainant', function ($subQ) use ($search) {
                            $subQ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('respondent', function ($subQ) use ($search) {
                            $subQ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            }

            // Eager load relationships and sort by case number
            $blotters = $query->with(['complainant.household.purok', 'respondent.household.purok', 'official', 'creator'])
                ->orderBy('case_number', 'asc')
                ->get();

            // Calculate summary statistics
            $totalCases = $blotters->count();
            $pendingCases = $blotters->where('status', 'pending')->count();
            $ongoingCases = $blotters->whereIn('status', ['ongoing', 'open', 'under_investigation'])->count();
            $resolvedCases = $blotters->whereIn('status', ['resolved', 'settled', 'closed'])->count();
            $approvedCases = $blotters->where('status', 'approved')->count();
            $rejectedCases = $blotters->where('status', 'rejected')->count();

            // Get current user info for "Prepared by"
            $preparedBy = [
                'name' => strtoupper($user->name ?? 'System Administrator'),
                'position' => ucwords(str_replace('_', ' ', $user->role ?? 'Staff')),
            ];

            // Get barangay captain for "Noted by" with signature
            $captain = \App\Models\User::where('role', 'captain')->first();
            $signatureBase64 = null;

            if ($captain && $captain->signature_path) {
                try {
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($captain->signature_path)) {
                        $signaturePath = \Illuminate\Support\Facades\Storage::disk('public')->path($captain->signature_path);
                        if (file_exists($signaturePath) && is_readable($signaturePath)) {
                            $imageData = @file_get_contents($signaturePath);
                            if ($imageData !== false) {
                                // Determine MIME type from extension
                                $extension = strtolower(pathinfo($captain->signature_path, PATHINFO_EXTENSION));
                                $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif'];
                                $mimeType = $mimeTypes[$extension] ?? 'image/png';

                                // If GD available, get more accurate MIME
                                if (extension_loaded('gd')) {
                                    $imageInfo = @getimagesizefromstring($imageData);
                                    if ($imageInfo !== false && isset($imageInfo['mime'])) {
                                        $mimeType = $imageInfo['mime'];
                                    }
                                }
                                $signatureBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to load captain signature for blotter PDF', ['error' => $e->getMessage()]);
                }
            }

            $notedBy = [
                'name' => $captain ? strtoupper($captain->name) : 'BARANGAY CAPTAIN',
                'position' => 'Punong Barangay',
                'signature_base64' => $signatureBase64,
            ];

            // Prepare data
            $data = [
                'title' => 'Blotter Records Report',
                'document_title' => 'BLOTTER / CASE RECORDS REPORT',
                'blotters' => $blotters,
                'filters' => [
                    'status' => $request->status ? ucfirst($request->status) : 'All Status',
                    'date_range' => ($request->start_date && $request->end_date)
                        ? \Carbon\Carbon::parse($request->start_date)->format('M d, Y') . ' - ' . \Carbon\Carbon::parse($request->end_date)->format('M d, Y')
                        : 'All Dates',
                    'search' => $request->search ?? null,
                ],
                'summary' => [
                    'total_cases' => $totalCases,
                    'pending' => $pendingCases,
                    'ongoing' => $ongoingCases,
                    'resolved' => $resolvedCases,
                    'approved' => $approvedCases,
                    'rejected' => $rejectedCases,
                ],
                'prepared_by' => $preparedBy,
                'noted_by' => $notedBy,
                'generated_date' => date('F d, Y'),
                'generated_time' => date('h:i A'),
            ];

            $filename = 'blotter-records-report-' . date('Y-m-d') . '.pdf';

            Log::info('Generating blotters PDF', [
                'blotter_count' => $blotters->count(),
                'filename' => $filename
            ]);

            // Use landscape orientation for blotter reports
            $options = [
                'orientation' => 'landscape',
                'paper' => 'a4',
            ];

            return $this->pdfService->generateReport('pdf.reports.blotters', $data, $filename, $options);
        } catch (\Exception $e) {
            Log::error('Blotters PDF export failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export incident reports list as PDF
     */
    public function exportIncidentReports(Request $request)
    {
        // Authorization check - allow admin, captain, staff
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'captain', 'staff', 'purok_leader'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get incident reports data
            $query = \App\Models\IncidentReport::query()->withoutTrashed();

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->byStatus($request->status);
            }

            if ($request->has('start_date') && $request->start_date) {
                $endDate = $request->end_date ?? date('Y-m-d');
                $query->byDateRange($request->start_date, $endDate);
            }

            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Eager load relationships and sort by incident date
            $incidentReports = $query->with(['reportingOfficer', 'creator'])
                ->orderBy('incident_date', 'desc')
                ->get();

            // Calculate summary statistics
            $totalReports = $incidentReports->count();
            $recordedReports = $incidentReports->where('status', 'Recorded')->count();
            $monitoringReports = $incidentReports->where('status', 'Monitoring')->count();
            $resolvedReports = $incidentReports->where('status', 'Resolved')->count();
            $pendingReports = $incidentReports->where('status', 'pending')->count();
            $approvedReports = $incidentReports->where('status', 'approved')->count();

            // Get current user info for "Prepared by"
            $preparedBy = [
                'name' => strtoupper($user->name ?? 'System Administrator'),
                'position' => ucwords(str_replace('_', ' ', $user->role ?? 'Staff')),
            ];

            // Get barangay captain for "Noted by" with signature
            $captain = \App\Models\User::where('role', 'captain')->first();
            $signatureBase64 = null;

            if ($captain && $captain->signature_path) {
                try {
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($captain->signature_path)) {
                        $signaturePath = \Illuminate\Support\Facades\Storage::disk('public')->path($captain->signature_path);
                        if (file_exists($signaturePath) && is_readable($signaturePath)) {
                            $imageData = @file_get_contents($signaturePath);
                            if ($imageData !== false) {
                                $extension = strtolower(pathinfo($captain->signature_path, PATHINFO_EXTENSION));
                                $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif'];
                                $mimeType = $mimeTypes[$extension] ?? 'image/png';
                                if (extension_loaded('gd')) {
                                    $imageInfo = @getimagesizefromstring($imageData);
                                    if ($imageInfo !== false && isset($imageInfo['mime'])) {
                                        $mimeType = $imageInfo['mime'];
                                    }
                                }
                                $signatureBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to load captain signature for incident reports PDF', ['error' => $e->getMessage()]);
                }
            }

            $notedBy = [
                'name' => $captain ? strtoupper($captain->name) : 'BARANGAY CAPTAIN',
                'position' => 'Punong Barangay',
                'signature_base64' => $signatureBase64,
            ];

            // Prepare data
            $data = [
                'title' => 'Incident Reports',
                'document_title' => 'INCIDENT REPORTS MASTERLIST',
                'incident_reports' => $incidentReports,
                'filters' => [
                    'status' => $request->status ? ucfirst($request->status) : 'All Status',
                    'date_range' => ($request->start_date && $request->end_date)
                        ? \Carbon\Carbon::parse($request->start_date)->format('M d, Y') . ' - ' . \Carbon\Carbon::parse($request->end_date)->format('M d, Y')
                        : 'All Dates',
                    'search' => $request->search ?? null,
                ],
                'summary' => [
                    'total_reports' => $totalReports,
                    'recorded' => $recordedReports,
                    'monitoring' => $monitoringReports,
                    'resolved' => $resolvedReports,
                    'pending' => $pendingReports,
                    'approved' => $approvedReports,
                ],
                'prepared_by' => $preparedBy,
                'noted_by' => $notedBy,
                'generated_date' => date('F d, Y'),
                'generated_time' => date('h:i A'),
            ];

            $filename = 'incident-reports-' . date('Y-m-d') . '.pdf';

            Log::info('Generating incident reports PDF', [
                'incident_count' => $incidentReports->count(),
                'filename' => $filename
            ]);

            // Use landscape orientation
            $options = [
                'orientation' => 'landscape',
                'paper' => 'a4',
            ];

            return $this->pdfService->generateReport('pdf.reports.incidents', $data, $filename, $options);
        } catch (\Exception $e) {
            Log::error('Incident Reports PDF export failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export issued certificates list as PDF
     */
    public function exportIssuedCertificates(Request $request)
    {
        // Authorization check - allow admin, captain, staff
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get issued certificates data
            $query = \App\Models\IssuedCertificate::with(['resident.household.purok', 'issuedBy']);

            // Apply filters
            if ($request->has('status') && $request->status && $request->status !== 'all') {
                if ($request->status === 'valid') {
                    $query->valid();
                } elseif ($request->status === 'expired') {
                    $query->expired();
                }
            }

            if ($request->has('certificate_type') && $request->certificate_type && $request->certificate_type !== 'all') {
                $query->byType($request->certificate_type);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('certificate_number', 'like', "%{$search}%")
                        ->orWhereHas('resident', function ($subQ) use ($search) {
                            $subQ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            }

            // Sort by certificate number
            $certificates = $query->orderBy('certificate_number', 'asc')->get();

            // Calculate summary statistics
            $totalCertificates = $certificates->count();
            $validCertificates = $certificates->filter(fn($c) => $c->is_valid && $c->valid_until >= now())->count();
            $expiredCertificates = $certificates->filter(fn($c) => $c->valid_until < now())->count();
            $invalidCertificates = $certificates->filter(fn($c) => !$c->is_valid)->count();

            // Count by type
            $byType = $certificates->groupBy('certificate_type')->map->count();

            // Get current user info for "Prepared by"
            $preparedBy = [
                'name' => strtoupper($user->name ?? 'System Administrator'),
                'position' => ucwords(str_replace('_', ' ', $user->role ?? 'Staff')),
            ];

            // Get barangay captain for "Noted by"
            $captain = \App\Models\User::where('role', 'captain')->first();
            $notedBy = [
                'name' => $captain ? strtoupper($captain->name) : 'BARANGAY CAPTAIN',
                'position' => 'Punong Barangay',
            ];

            // Prepare data
            $data = [
                'title' => 'Issued Certificates Report',
                'document_title' => 'ISSUED CERTIFICATES MASTERLIST',
                'certificates' => $certificates,
                'filters' => [
                    'status' => $request->status && $request->status !== 'all' ? ucfirst($request->status) : 'All Status',
                    'certificate_type' => $request->certificate_type && $request->certificate_type !== 'all'
                        ? ucwords(str_replace('_', ' ', $request->certificate_type))
                        : 'All Types',
                    'search' => $request->search ?? null,
                ],
                'summary' => [
                    'total' => $totalCertificates,
                    'valid' => $validCertificates,
                    'expired' => $expiredCertificates,
                    'invalid' => $invalidCertificates,
                    'by_type' => $byType,
                ],
                'prepared_by' => $preparedBy,
                'noted_by' => $notedBy,
                'generated_date' => date('F d, Y'),
                'generated_time' => date('h:i A'),
            ];

            $filename = 'issued-certificates-report-' . date('Y-m-d') . '.pdf';

            Log::info('Generating issued certificates PDF', [
                'certificate_count' => $certificates->count(),
                'filename' => $filename
            ]);

            // Use landscape orientation
            $options = [
                'orientation' => 'landscape',
                'paper' => 'a4',
            ];

            return $this->pdfService->generateReport('pdf.reports.issued-certificates', $data, $filename, $options);
        } catch (\Exception $e) {
            Log::error('Issued Certificates PDF export failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export solo parents list as PDF
     */
    public function exportSoloParents(Request $request)
    {
        // Authorization check
        $user = Auth::user();
        if (!$user || ($user->role !== 'admin' && $user->role !== 'staff' && $user->role !== 'purok_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get solo parents data
            $query = \App\Models\SoloParent::with(['resident.household.purok', 'verifier']);

            // Role-based filtering
            if ($user->role === 'purok_leader' && $user->assigned_purok_id) {
                $query->byPurok($user->assigned_purok_id);
            }

            // Apply filters
            if ($request->has('purok_id') && $request->purok_id) {
                $query->byPurok($request->purok_id);
            }

            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            if ($request->has('status') && $request->status) {
                $query->byComputedStatus($request->status);
            }

            // Sort by date declared
            $soloParents = $query->orderBy('date_declared', 'desc')->get();

            // Prepare data
            $data = [
                'title' => 'Solo Parents Report',
                'document_title' => 'SOLO PARENTS REPORT',
                'solo_parents' => $soloParents,
                'filters' => [
                    'purok' => $request->purok_id ? \App\Models\Purok::find($request->purok_id)?->name : 'All',
                    'search' => $request->search ?? 'None',
                    'status' => $request->status ?? 'All',
                ],
            ];

            $filename = 'solo-parents-report-' . date('Y-m-d') . '.pdf';
            return $this->pdfService->generateReport('pdf.reports.solo-parents', $data, $filename);
        } catch (\Exception $e) {
            Log::error('Solo parents PDF export failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF'
            ], 500);
        }
    }

    /**
     * Export puroks summary as PDF
     */
    public function exportPuroks(Request $request)
    {
        // Authorization check
        $user = Auth::user();
        if (!$user || ($user->role !== 'admin' && $user->role !== 'staff' && $user->role !== 'purok_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Apply role-based filtering
            $purokQuery = \App\Models\Purok::query();

            // For purok leaders, only show their assigned purok
            /** @var \App\Models\User $user */
            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $purokQuery->where('id', $user->assigned_purok_id);
            }

            // Get puroks data with statistics (matching ReportController logic)
            $puroks = $purokQuery->get();

            // Calculate statistics for each purok
            $puroksData = $puroks->map(function ($purok) {
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
                    'captain' => $purok->captain ?? 'N/A',
                    'contact' => $purok->contact ?? 'N/A',
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
            });

            // Calculate totals
            $totals = [
                'households' => $puroksData->sum('household_count'),
                'residents' => $puroksData->sum('resident_count'),
                'males' => $puroksData->sum('male_count'),
                'females' => $puroksData->sum('female_count'),
                'seniors' => $puroksData->sum('senior_count'),
                'children' => $puroksData->sum('child_count'),
                'pwds' => $puroksData->sum('pwd_count'),
            ];

            // Prepare data
            $data = [
                'title' => 'Puroks Summary',
                'document_title' => 'PUROKS SUMMARY REPORT',
                'puroks' => $puroksData,
                'totals' => $totals,
            ];

            $filename = 'puroks-summary-' . date('Y-m-d') . '.pdf';
            return $this->pdfService->generateReport('pdf.reports.puroks', $data, $filename);
        } catch (\Exception $e) {
            Log::error('Puroks PDF export failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF'
            ], 500);
        }
    }

    /**
     * Export vaccinations list as PDF
     */
    public function exportVaccinations(Request $request)
    {
        // Authorization check - allow admin, captain, staff, and purok_leader
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'captain', 'staff', 'purok_leader'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get vaccinations data (reuse VaccinationController query logic)
            $query = \App\Models\Vaccination::query();

            // Role-based filtering for purok leaders
            if ($user->role === 'purok_leader' && $user->assigned_purok_id) {
                $query->byPurok($user->assigned_purok_id);
            }

            // Apply filters from request
            if ($request->has('purok_id') && $request->purok_id) {
                $query->byPurok($request->purok_id);
            }

            if ($request->has('status') && $request->status) {
                $query->byStatus($request->status);
            }

            if ($request->has('vaccine_name') && $request->vaccine_name) {
                $query->byVaccine($request->vaccine_name);
            }

            if ($request->has('date_from') && $request->date_from && $request->has('date_to') && $request->date_to) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            if ($request->has('age_group') && $request->age_group) {
                switch ($request->age_group) {
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

            if ($request->has('search') && $request->search) {
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

            // Sort alphabetically by resident's last name, first name and eager load relationships
            $vaccinations = $query->with(['resident.household.purok'])
                ->join('residents', 'vaccinations.resident_id', '=', 'residents.id')
                ->orderBy('residents.last_name', 'asc')
                ->orderBy('residents.first_name', 'asc')
                ->select('vaccinations.*')
                ->get();

            // Calculate summary statistics
            $totalRecords = $vaccinations->count();
            $uniqueResidents = $vaccinations->pluck('resident_id')->unique()->count();
            $fullyVaccinated = $vaccinations->where('status', 'completed')->count();
            $partiallyVaccinated = $vaccinations->where('status', 'partial')->count();
            $pendingVaccinations = $vaccinations->where('status', 'pending')->count();

            // Get most common vaccine
            $vaccineCounts = $vaccinations->groupBy('vaccine_name')->map->count();
            $mostCommonVaccine = $vaccineCounts->count() > 0
                ? $vaccineCounts->sortDesc()->keys()->first()
                : 'N/A';

            // Get current user info for "Prepared by"
            $preparedBy = [
                'name' => strtoupper($user->name ?? 'System Administrator'),
                'position' => ucwords(str_replace('_', ' ', $user->role ?? 'Staff')),
            ];

            // Get barangay captain for "Noted by" with signature
            $captain = \App\Models\User::where('role', 'captain')->first();
            $signatureBase64 = null;

            if ($captain && $captain->signature_path) {
                try {
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($captain->signature_path)) {
                        $signaturePath = \Illuminate\Support\Facades\Storage::disk('public')->path($captain->signature_path);
                        if (file_exists($signaturePath) && is_readable($signaturePath)) {
                            $imageData = @file_get_contents($signaturePath);
                            if ($imageData !== false) {
                                $extension = strtolower(pathinfo($captain->signature_path, PATHINFO_EXTENSION));
                                $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif'];
                                $mimeType = $mimeTypes[$extension] ?? 'image/png';
                                if (extension_loaded('gd')) {
                                    $imageInfo = @getimagesizefromstring($imageData);
                                    if ($imageInfo !== false && isset($imageInfo['mime'])) {
                                        $mimeType = $imageInfo['mime'];
                                    }
                                }
                                $signatureBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to load captain signature for vaccination PDF', ['error' => $e->getMessage()]);
                }
            }

            $notedBy = [
                'name' => $captain ? strtoupper($captain->name) : 'BARANGAY CAPTAIN',
                'position' => 'Punong Barangay',
                'signature_base64' => $signatureBase64,
            ];

            // Prepare data
            $data = [
                'title' => 'Vaccination Masterlist Report',
                'document_title' => 'VACCINATION MASTERLIST REPORT',
                'vaccinations' => $vaccinations,
                'filters' => [
                    'purok' => $request->purok_id ? \App\Models\Purok::find($request->purok_id)?->name : 'All Puroks',
                    'status' => $request->status ? ucfirst($request->status) : 'All Status',
                    'vaccine' => $request->vaccine_name ?? 'All Vaccines',
                    'date_range' => ($request->date_from && $request->date_to)
                        ? \Carbon\Carbon::parse($request->date_from)->format('M d, Y') . ' - ' . \Carbon\Carbon::parse($request->date_to)->format('M d, Y')
                        : 'All Dates',
                    'age_group' => $request->age_group ? ucfirst($request->age_group) : 'All Ages',
                ],
                'summary' => [
                    'total_records' => $totalRecords,
                    'unique_residents' => $uniqueResidents,
                    'fully_vaccinated' => $fullyVaccinated,
                    'partially_vaccinated' => $partiallyVaccinated,
                    'pending' => $pendingVaccinations,
                    'most_common_vaccine' => $mostCommonVaccine,
                ],
                'prepared_by' => $preparedBy,
                'noted_by' => $notedBy,
                'generated_date' => date('F d, Y'),
                'generated_time' => date('h:i A'),
                'is_landscape' => true,
            ];

            $filename = 'vaccination-masterlist-report-' . date('Y-m-d') . '.pdf';

            Log::info('Generating vaccinations PDF', [
                'vaccination_count' => $vaccinations->count(),
                'filename' => $filename
            ]);

            // Use landscape orientation for vaccination reports
            $options = [
                'orientation' => 'landscape',
                'paper' => 'a4',
            ];

            return $this->pdfService->generateReport('pdf.reports.vaccinations', $data, $filename, $options);
        } catch (\Exception $e) {
            Log::error('Vaccinations PDF export failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export vaccinations list as Excel
     */
    public function exportVaccinationsExcel(Request $request)
    {
        // Authorization check - allow admin, captain, staff, and purok_leader
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'captain', 'staff', 'purok_leader'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Build query (reuse same logic as PDF export)
            // Start with query() to avoid issues when applying scopes
            $query = \App\Models\Vaccination::query();

            // Role-based filtering for purok leaders
            if ($user->role === 'purok_leader' && $user->assigned_purok_id) {
                $query->byPurok($user->assigned_purok_id);
            }

            // Apply filters from request
            if ($request->has('purok_id') && $request->purok_id) {
                $query->byPurok($request->purok_id);
            }

            if ($request->has('status') && $request->status) {
                $query->byStatus($request->status);
            }

            if ($request->has('vaccine_name') && $request->vaccine_name) {
                $query->byVaccine($request->vaccine_name);
            }

            if ($request->has('date_from') && $request->date_from && $request->has('date_to') && $request->date_to) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            if ($request->has('age_group') && $request->age_group) {
                switch ($request->age_group) {
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

            if ($request->has('search') && $request->search) {
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

            // Sort by date administered (most recent first)
            // Note: NULL dates will appear at the end
            // Relationships will be eager loaded in the export class
            $query->orderBy('date_administered', 'desc');

            // Generate filename
            $filename = 'vaccination-records-' . date('Y-m-d') . '.xlsx';

            // Export to Excel - pass the query builder
            // The export class will handle eager loading relationships
            return Excel::download(new VaccinationExport($query), $filename);
        } catch (\Exception $e) {
            Log::error('Vaccinations Excel export failed: ' . $e->getMessage(), [
                'user_id' => $user->id ?? null,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate Excel: ' . $e->getMessage()
            ], 500);
        }
    }
}
