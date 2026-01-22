<?php

namespace App\Http\Controllers;

use App\Http\Requests\IncidentReport\StoreIncidentReportRequest;
use App\Http\Requests\IncidentReport\UpdateIncidentReportRequest;
use App\Models\IncidentReport;
use App\Models\User;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class IncidentReportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = IncidentReport::withoutTrashed()->with([
                'reportingOfficer:id,name',
                'creator:id,name',
                'updater:id,name',
                'approver:id,name',
                'rejector:id,name'
            ]);

            // Apply filters
            if ($request->has('status') && $request->status !== '') {
                $query->byStatus($request->status);
            }

            if ($request->has('start_date') && $request->start_date !== '') {
                $endDate = $request->end_date ?? date('Y-m-d');
                $query->byDateRange($request->start_date, $endDate);
            }

            if ($request->has('search') && $request->search !== '') {
                $query->search($request->search);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $incidentReports = $query->orderBy('incident_date', 'desc')
                ->orderBy('incident_time', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $incidentReports,
                'message' => 'Incident reports retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving incident reports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve incident reports'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIncidentReportRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $data['created_by'] = Auth::id();

            // If created by staff, set status to pending for approval
            $user = Auth::user();
            if ($user && $user->isStaff()) {
                $data['status'] = 'pending';
            } else {
                // Admin/purok_leader can set status directly (default to 'Recorded' if not set)
                $data['status'] = $data['status'] ?? 'Recorded';
            }

            // Convert persons_involved string to JSON array if provided
            if (isset($data['persons_involved']) && is_string($data['persons_involved'])) {
                // If it's a JSON string, decode it; otherwise, create an array
                $decoded = json_decode($data['persons_involved'], true);
                $data['persons_involved'] = $decoded !== null ? $decoded : [$data['persons_involved']];
            }

            $incidentReport = IncidentReport::create($data);
            $incidentReport->load([
                'reportingOfficer:id,name',
                'creator:id,name'
            ]);

            // If created by staff (pending status), notify captain for approval
            if ($incidentReport->status === 'pending') {
                NotificationController::notifyCaptainForApproval(
                    'incident',
                    $incidentReport->incident_title,
                    $incidentReport->id,
                    $incidentReport->created_by
                );
            }

            Log::info('Incident report created', ['id' => $incidentReport->id, 'title' => $incidentReport->incident_title]);

            return response()->json([
                'success' => true,
                'data' => $incidentReport,
                'message' => 'Incident report created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating incident report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create incident report'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $incidentReport = IncidentReport::with([
                'reportingOfficer:id,name,email',
                'creator:id,name',
                'updater:id,name'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $incidentReport,
                'message' => 'Incident report retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving incident report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Incident report not found'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIncidentReportRequest $request, string $id): JsonResponse
    {
        try {
            $incidentReport = IncidentReport::findOrFail($id);
            $data = $request->validated();
            $data['updated_by'] = Auth::id();

            // Convert persons_involved string to JSON array if provided
            if (isset($data['persons_involved']) && is_string($data['persons_involved'])) {
                $decoded = json_decode($data['persons_involved'], true);
                $data['persons_involved'] = $decoded !== null ? $decoded : [$data['persons_involved']];
            }

            $incidentReport->update($data);
            $incidentReport->load([
                'reportingOfficer:id,name',
                'creator:id,name',
                'updater:id,name'
            ]);

            Log::info('Incident report updated', ['id' => $incidentReport->id, 'title' => $incidentReport->incident_title]);

            return response()->json([
                'success' => true,
                'data' => $incidentReport,
                'message' => 'Incident report updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating incident report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update incident report'
            ], 500);
        }
    }

    /**
     * Approve an incident report (captain only)
     */
    public function approve(Request $request, IncidentReport $incidentReport): JsonResponse
    {
        // Authorization: Only captain or admin can approve
        $user = Auth::user();
        if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Only Barangay Captain or Admin can approve incident reports'
            ], 403);
        }

        if (!$incidentReport->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Incident report cannot be approved'
            ], 400);
        }

        // Get the captain user (if current user is captain, use them; otherwise find captain user)
        $captainUser = $user->isCaptain() ? $user : User::where('role', 'captain')->first();
        
        if (!$captainUser) {
            return response()->json([
                'success' => false,
                'message' => 'No Barangay Captain found in the system'
            ], 400);
        }

        // Check if captain has a signature uploaded (mandatory for approval)
        if (!$captainUser->signature_path) {
            return response()->json([
                'success' => false,
                'message' => 'Barangay Captain signature is not set. Please upload signature first before approving any requests.'
            ], 400);
        }

        // Approve the incident report
        $incidentReport->approve($user);
        
        // Move to 'Recorded' status after approval (becomes official record)
        $incidentReport->status = 'Recorded';
        $incidentReport->save();

        // Reload relationships
        $incidentReport->load([
            'reportingOfficer:id,name',
            'creator:id,name',
            'approver:id,name'
        ]);

        // Notify the creator (staff) that their request was approved
        if ($incidentReport->created_by) {
            NotificationController::createUserNotification(
                $incidentReport->created_by,
                'Incident Report Approved',
                "Your incident report '{$incidentReport->incident_title}' has been approved by the Barangay Captain.",
                'incident_approved'
            );
        }

        // Create system notification
        NotificationController::createSystemNotification(
            'Incident Report Approved',
            "Incident report '{$incidentReport->incident_title}' has been approved and is now an official record.",
            'incident_approved'
        );

        return response()->json([
            'success' => true,
            'message' => 'Incident report approved successfully',
            'data' => $incidentReport
        ]);
    }

    /**
     * Reject an incident report (captain only)
     */
    public function reject(Request $request, IncidentReport $incidentReport): JsonResponse
    {
        // Authorization: Only captain or admin can reject
        $user = Auth::user();
        if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Only Barangay Captain or Admin can reject incident reports'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'remarks' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$incidentReport->canBeRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Incident report cannot be rejected'
            ], 400);
        }

        // Reject the incident report
        $incidentReport->reject($user, $request->remarks);
        
        // Reload relationships
        $incidentReport->load([
            'reportingOfficer:id,name',
            'creator:id,name',
            'rejector:id,name'
        ]);

        // Notify the creator (staff) that their request was rejected
        if ($incidentReport->created_by) {
            NotificationController::createUserNotification(
                $incidentReport->created_by,
                'Incident Report Rejected',
                "Your incident report '{$incidentReport->incident_title}' has been rejected. Reason: {$request->remarks}",
                'incident_rejected'
            );
        }

        // Create system notification
        NotificationController::createSystemNotification(
            'Incident Report Rejected',
            "Incident report '{$incidentReport->incident_title}' has been rejected. Reason: {$request->remarks}",
            'incident_rejected'
        );

        return response()->json([
            'success' => true,
            'message' => 'Incident report rejected successfully',
            'data' => $incidentReport
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $incidentReport = IncidentReport::findOrFail($id);
            $incidentReport->delete();

            Log::info('Incident report deleted', ['id' => $incidentReport->id, 'title' => $incidentReport->incident_title]);

            return response()->json([
                'success' => true,
                'message' => 'Incident report deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting incident report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete incident report'
            ], 500);
        }
    }
}
