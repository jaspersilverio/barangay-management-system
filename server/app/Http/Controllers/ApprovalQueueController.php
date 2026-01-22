<?php

namespace App\Http\Controllers;

use App\Models\CertificateRequest;
use App\Models\Blotter;
use App\Models\IncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ApprovalQueueController extends Controller
{
    /**
     * Get all pending requests requiring approval (captain only)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Authorization: Only captain or admin can view approval queue
            $user = Auth::user();
            if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Barangay Captain or Admin can access approval queue'
                ], 403);
            }

            // Get pending certificate requests
        $certificateRequests = CertificateRequest::pending()
            ->with(['resident:id,first_name,last_name,middle_name', 'requestedBy:id,name'])
            ->orderBy('requested_at', 'asc')
            ->get()
            ->map(function ($request) {
                $residentName = $request->resident ? $request->resident->full_name : 'Unknown Resident';
                return [
                    'id' => $request->id,
                    'type' => 'certificate',
                    'type_label' => 'Certificate Request',
                    'title' => ($request->certificate_type_label ?? 'Certificate') . ' - ' . $residentName,
                    'subtitle' => 'Purpose: ' . ($request->purpose ?? 'N/A'),
                    'requested_by' => $request->requestedBy->name ?? 'Unknown',
                    'requested_at' => $request->requested_at,
                    'data' => $request
                ];
            });

        // Get pending blotter cases
        $blotters = Blotter::pending()
            ->with(['complainant:id,first_name,last_name,middle_name', 'respondent:id,first_name,last_name,middle_name', 'creator:id,name'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($blotter) {
                // Get complainant name (accessor needs relationships loaded)
                $complainantName = $blotter->complainant_name ?? 'Unknown';
                $respondentName = $blotter->respondent_name ?? 'Unknown';
                
                return [
                    'id' => $blotter->id,
                    'type' => 'blotter',
                    'type_label' => 'Blotter Case',
                    'title' => $blotter->case_number . ' - ' . $complainantName . ' vs ' . $respondentName,
                    'subtitle' => 'Location: ' . ($blotter->incident_location ?? 'N/A'),
                    'requested_by' => $blotter->creator->name ?? 'Unknown',
                    'requested_at' => $blotter->created_at,
                    'data' => $blotter
                ];
            });

        // Get pending incident reports
        $incidentReports = IncidentReport::pending()
            ->with(['creator:id,name', 'reportingOfficer:id,name'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($incident) {
                return [
                    'id' => $incident->id,
                    'type' => 'incident',
                    'type_label' => 'Incident Report',
                    'title' => $incident->incident_title ?? 'Untitled Incident',
                    'subtitle' => 'Location: ' . ($incident->location ?? 'N/A'),
                    'requested_by' => $incident->creator->name ?? 'Unknown',
                    'requested_at' => $incident->created_at,
                    'data' => $incident
                ];
            });

        // Combine all pending requests
        $allRequests = $certificateRequests->concat($blotters)->concat($incidentReports);

        // Sort by requested_at (oldest first)
        $allRequests = $allRequests->sortBy('requested_at')->values();

        // Apply filters
        if ($request->has('type') && $request->type !== 'all') {
            $allRequests = $allRequests->filter(function ($item) use ($request) {
                return $item['type'] === $request->type;
            })->values();
        }

        // Get statistics
        $stats = [
            'total_pending' => $allRequests->count(),
            'certificates' => $certificateRequests->count(),
            'blotters' => $blotters->count(),
            'incidents' => $incidentReports->count()
        ];

            return response()->json([
                'success' => true,
                'data' => $allRequests,
                'statistics' => $stats
            ]);
        } catch (\Exception $e) {
            \Log::error('ApprovalQueueController index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve approval queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending count for dashboard
     */
    public function pendingCount(): JsonResponse
    {
        // Authorization: Only captain or admin
        $user = Auth::user();
        if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Only Barangay Captain or Admin can access pending count'
            ], 403);
        }

        $count = CertificateRequest::pending()->count()
            + Blotter::pending()->count()
            + IncidentReport::pending()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_pending' => $count,
                'certificates' => CertificateRequest::pending()->count(),
                'blotters' => Blotter::pending()->count(),
                'incidents' => IncidentReport::pending()->count()
            ]
        ]);
    }
}
