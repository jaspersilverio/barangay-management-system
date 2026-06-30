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

            $status = $request->input('status', 'pending');
            if (! \in_array($status, ['pending', 'approved', 'rejected'], true)) {
                $status = 'pending';
            }

            $certificateQuery = CertificateRequest::query()
                ->with(['resident:id,first_name,last_name,middle_name', 'requestedBy:id,name']);

            if ($status === 'pending') {
                $certificateQuery->pending();
            } elseif ($status === 'approved') {
                $certificateQuery->whereIn('status', ['approved', 'issued', 'released']);
            } else {
                $certificateQuery->where('status', 'rejected');
            }

            $certificateOrder = match ($status) {
                'pending' => 'requested_at',
                'rejected' => 'rejected_at',
                default => 'approved_at',
            };

            $certificateRequests = $certificateQuery
                ->orderBy($certificateOrder, 'desc')
                ->get()
                ->map(fn ($req) => $this->mapCertificateQueueItem($req));

            $blotterQuery = Blotter::query()
                ->with(['complainant:id,first_name,last_name,middle_name', 'respondent:id,first_name,last_name,middle_name', 'creator:id,name']);

            if ($status === 'pending') {
                $blotterQuery->pending();
            } elseif ($status === 'approved') {
                $blotterQuery->approved();
            } else {
                $blotterQuery->rejected();
            }

            $blotters = $blotterQuery
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($b) => $this->mapBlotterQueueItem($b));

            $incidentQuery = IncidentReport::query()
                ->with(['creator:id,name', 'reportingOfficer:id,name']);

            if ($status === 'pending') {
                $incidentQuery->pending();
            } elseif ($status === 'approved') {
                $incidentQuery->approved();
            } else {
                $incidentQuery->rejected();
            }

            $incidentReports = $incidentQuery
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($i) => $this->mapIncidentQueueItem($i));

            $allRequests = $certificateRequests->concat($blotters)->concat($incidentReports)
                ->sortByDesc(fn ($item) => $item['requested_at'] ?? '')
                ->values();

            if ($request->filled('type') && $request->type !== 'all') {
                $allRequests = $allRequests->filter(fn ($item) => $item['type'] === $request->type)->values();
            }

            $stats = $this->buildQueueStatistics($status);

            return response()->json([
                'success' => true,
                'data' => $allRequests,
                'statistics' => $stats,
                'status' => $status,
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

    private function mapCertificateQueueItem(CertificateRequest $request): array
    {
        $residentName = $request->resident ? $request->resident->full_name : 'Unknown Resident';
        $rejectionReason = $request->status === 'rejected' ? ($request->remarks ?? null) : null;

        return [
            'id' => $request->id,
            'type' => 'certificate',
            'type_label' => 'Certificate Request',
            'title' => ($request->certificate_type_label ?? 'Certificate').' - '.$residentName,
            'subtitle' => 'Purpose: '.($request->purpose ?? 'N/A'),
            'requested_by' => $request->requestedBy->name ?? 'Unknown',
            'requested_at' => $request->requested_at,
            'status' => $request->status,
            'rejection_reason' => $rejectionReason,
            'data' => $request,
        ];
    }

    private function mapBlotterQueueItem(Blotter $blotter): array
    {
        $complainantName = $blotter->complainant_name ?? 'Unknown';
        $respondentName = $blotter->respondent_name ?? 'Unknown';

        return [
            'id' => $blotter->id,
            'type' => 'blotter',
            'type_label' => 'Blotter Case',
            'title' => $blotter->case_number.' - '.$complainantName.' vs '.$respondentName,
            'subtitle' => 'Location: '.($blotter->incident_location ?? 'N/A'),
            'requested_by' => $blotter->creator->name ?? 'Unknown',
            'requested_at' => $blotter->created_at,
            'status' => $blotter->status,
            'rejection_reason' => $blotter->status === 'rejected' ? ($blotter->rejection_remarks ?? null) : null,
            'data' => $blotter,
        ];
    }

    private function mapIncidentQueueItem(IncidentReport $incident): array
    {
        return [
            'id' => $incident->id,
            'type' => 'incident',
            'type_label' => 'Incident Report',
            'title' => $incident->incident_title ?? 'Untitled Incident',
            'subtitle' => 'Location: '.($incident->location ?? 'N/A'),
            'requested_by' => $incident->creator->name ?? 'Unknown',
            'requested_at' => $incident->created_at,
            'status' => $incident->status,
            'rejection_reason' => $incident->status === 'rejected' ? ($incident->rejection_remarks ?? null) : null,
            'data' => $incident,
        ];
    }

    /**
     * @return array{total_pending: int, certificates: int, blotters: int, incidents: int}
     */
    private function buildQueueStatistics(string $status): array
    {
        if ($status === 'pending') {
            $total = CertificateRequest::pending()->count()
                + Blotter::pending()->count()
                + IncidentReport::pending()->count();

            return [
                'total' => $total,
                'total_pending' => $total,
                'certificates' => CertificateRequest::pending()->count(),
                'blotters' => Blotter::pending()->count(),
                'incidents' => IncidentReport::pending()->count(),
            ];
        }

        if ($status === 'approved') {
            $cert = CertificateRequest::whereIn('status', ['approved', 'issued', 'released'])->count();
            $total = $cert + Blotter::approved()->count() + IncidentReport::approved()->count();

            return [
                'total' => $total,
                'total_pending' => $total,
                'certificates' => $cert,
                'blotters' => Blotter::approved()->count(),
                'incidents' => IncidentReport::approved()->count(),
            ];
        }

        $total = CertificateRequest::rejected()->count()
            + Blotter::rejected()->count()
            + IncidentReport::rejected()->count();

        return [
            'total' => $total,
            'total_pending' => $total,
            'certificates' => CertificateRequest::rejected()->count(),
            'blotters' => Blotter::rejected()->count(),
            'incidents' => IncidentReport::rejected()->count(),
        ];
    }
}
