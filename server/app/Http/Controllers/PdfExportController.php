<?php

namespace App\Http\Controllers;

use App\Services\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

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
            // Get households data
            $query = \App\Models\Household::with(['purok']);

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
                'document_title' => 'HOUSEHOLDS LIST',
                'households' => $households,
                'filters' => [
                    'purok' => $request->purok_id ? \App\Models\Purok::find($request->purok_id)?->name : 'All',
                    'search' => $request->search ?? 'None',
                ],
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
        // Authorization check
        $user = Auth::user();
        if (!$user || ($user->role !== 'admin' && $user->role !== 'staff')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Get blotters data
            $query = \App\Models\Blotter::withoutTrashed()
                ->with(['complainant', 'respondent', 'official']);

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->byStatus($request->status);
            }

            if ($request->has('start_date') && $request->start_date) {
                $endDate = $request->end_date ?? date('Y-m-d');
                $query->byDateRange($request->start_date, $endDate);
            }

            $blotters = $query->orderBy('incident_date', 'desc')->get();

            // Prepare data
            $data = [
                'title' => 'Blotter Entries',
                'document_title' => 'BLOTTER ENTRIES',
                'blotters' => $blotters,
                'filters' => [
                    'status' => $request->status ?? 'All',
                    'date_range' => $request->start_date && $request->end_date
                        ? $request->start_date . ' to ' . $request->end_date
                        : 'All dates',
                ],
            ];

            $filename = 'blotter-entries-' . date('Y-m-d') . '.pdf';
            return $this->pdfService->generateReport('pdf.reports.blotters', $data, $filename);
        } catch (\Exception $e) {
            Log::error('Blotters PDF export failed: ' . $e->getMessage(), [
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
            // Get puroks data with statistics (matching ReportController logic)
            $puroks = \App\Models\Purok::withCount([
                'households' => function ($query) {
                    $query->withoutTrashed();
                },
                'residents' => function ($query) {
                    $query->withoutTrashed();
                }
            ])->with(['households.residents'])->get();

            // Calculate statistics for each purok
            $puroksData = $puroks->map(function ($purok) {
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
}
