<?php

namespace App\Http\Controllers;

use App\Models\CertificateRequest;
use App\Models\Resident;
use App\Models\User;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CertificateRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CertificateRequest::with(['resident', 'requestedBy', 'approvedBy', 'releasedBy']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by certificate type
        if ($request->has('certificate_type') && $request->certificate_type !== 'all') {
            $query->where('certificate_type', $request->certificate_type);
        }

        // Filter by resident
        if ($request->has('resident_id')) {
            $query->where('resident_id', $request->resident_id);
        }

        // Search by resident name
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('resident', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->has('date_from')) {
            $query->whereDate('requested_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('requested_at', '<=', $request->date_to);
        }

        $requests = $query->orderBy('requested_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'resident_id' => 'required|exists:residents,id',
            'certificate_type' => 'required|in:barangay_clearance,indigency,residency,business_permit_endorsement',
            'purpose' => 'required|string|max:500',
            'additional_requirements' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $certificateRequest = CertificateRequest::create([
            'resident_id' => $request->resident_id,
            'requested_by' => Auth::id(),
            'certificate_type' => $request->certificate_type,
            'purpose' => $request->purpose,
            'additional_requirements' => $request->additional_requirements,
            'status' => 'pending'
        ]);

        // Create notification for admins
        NotificationController::createSystemNotification(
            'New Certificate Request',
            "New {$certificateRequest->certificate_type_label} request from {$certificateRequest->resident->full_name}",
            'certificate_request'
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate request created successfully',
            'data' => $certificateRequest->load(['resident', 'requestedBy'])
        ], 201);
    }

    public function show(CertificateRequest $certificateRequest): JsonResponse
    {
        $certificateRequest->load(['resident', 'requestedBy', 'approvedBy', 'releasedBy', 'issuedCertificate']);

        return response()->json([
            'success' => true,
            'data' => $certificateRequest
        ]);
    }

    public function update(Request $request, CertificateRequest $certificateRequest): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'purpose' => 'sometimes|required|string|max:500',
            'additional_requirements' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $certificateRequest->update($request->only(['purpose', 'additional_requirements']));

        return response()->json([
            'success' => true,
            'message' => 'Certificate request updated successfully',
            'data' => $certificateRequest->load(['resident', 'requestedBy'])
        ]);
    }

    public function destroy(CertificateRequest $certificateRequest): JsonResponse
    {
        if ($certificateRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete non-pending certificate request'
            ], 400);
        }

        $certificateRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Certificate request deleted successfully'
        ]);
    }

    public function approve(Request $request, CertificateRequest $certificateRequest): JsonResponse
    {
        if (!$certificateRequest->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate request cannot be approved'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'remarks' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $certificateRequest->approve(Auth::user(), $request->remarks);

        // Create system notification for admins
        NotificationController::createSystemNotification(
            'Certificate Request Approved',
            "Certificate request for {$certificateRequest->resident->full_name} has been approved.",
            'certificate_approved'
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate request approved successfully',
            'data' => $certificateRequest->load(['resident', 'approvedBy'])
        ]);
    }

    public function reject(Request $request, CertificateRequest $certificateRequest): JsonResponse
    {
        if (!$certificateRequest->canBeRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate request cannot be rejected'
            ], 400);
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

        $certificateRequest->reject(Auth::user(), $request->remarks);

        // Create system notification for admins
        NotificationController::createSystemNotification(
            'Certificate Request Rejected',
            "Certificate request for {$certificateRequest->resident->full_name} has been rejected. Reason: {$request->remarks}",
            'certificate_rejected'
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate request rejected successfully',
            'data' => $certificateRequest->load(['resident', 'approvedBy'])
        ]);
    }

    public function release(Request $request, CertificateRequest $certificateRequest): JsonResponse
    {
        if (!$certificateRequest->canBeReleased()) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate request cannot be released'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'remarks' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $certificateRequest->release(Auth::user(), $request->remarks);

        // Create system notification for admins
        NotificationController::createSystemNotification(
            'Certificate Released',
            "Certificate for {$certificateRequest->resident->full_name} is ready for pickup.",
            'certificate_released'
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate released successfully',
            'data' => $certificateRequest->load(['resident', 'releasedBy'])
        ]);
    }

    public function statistics(): JsonResponse
    {
        $stats = [
            'total_requests' => CertificateRequest::count(),
            'pending_requests' => CertificateRequest::pending()->count(),
            'approved_requests' => CertificateRequest::approved()->count(),
            'released_requests' => CertificateRequest::released()->count(),
            'rejected_requests' => CertificateRequest::rejected()->count(),
            'by_type' => [
                'barangay_clearance' => CertificateRequest::byType('barangay_clearance')->count(),
                'indigency' => CertificateRequest::byType('indigency')->count(),
                'residency' => CertificateRequest::byType('residency')->count(),
                'business_permit_endorsement' => CertificateRequest::byType('business_permit_endorsement')->count(),
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
