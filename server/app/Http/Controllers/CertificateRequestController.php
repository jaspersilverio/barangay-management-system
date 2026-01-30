<?php

namespace App\Http\Controllers;

use App\Models\CertificateRequest;
use App\Models\IssuedCertificate;
use App\Models\Official;
use App\Models\Resident;
use App\Models\User;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CertificatePdfController;
use App\Services\PdfService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

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

        // Reload to get relationships
        $certificateRequest->load('resident');

        // Notify captain for approval (instead of system-wide notification)
        NotificationController::notifyCaptainForApproval(
            'certificate',
            $certificateRequest->certificate_type_label . ' - ' . $certificateRequest->resident->full_name,
            $certificateRequest->id,
            $certificateRequest->requested_by
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

    /**
     * Get officials for certificate signing
     */
    protected function getOfficialsForCertificate(): array
    {
        $officials = Official::active()
            ->orderBy('position')
            ->get();

        $organized = [];
        foreach ($officials as $official) {
            $position = strtolower($official->position);

            // Map common positions
            if (str_contains($position, 'captain') || str_contains($position, 'punong barangay')) {
                $organized['captain'] = [
                    'name' => $official->name,
                    'position' => $official->position
                ];
            } elseif (str_contains($position, 'secretary')) {
                $organized['secretary'] = [
                    'name' => $official->name,
                    'position' => $official->position
                ];
            } elseif (str_contains($position, 'treasurer')) {
                $organized['treasurer'] = [
                    'name' => $official->name,
                    'position' => $official->position
                ];
            }
        }

        return $organized;
    }

    /**
     * Get default validity dates for a certificate
     */
    protected function getDefaultValidityDates(): array
    {
        $validFrom = Carbon::today();
        // Default validity: 30 days for most certificates
        $validUntil = $validFrom->copy()->addDays(30);

        return [
            'valid_from' => $validFrom,
            'valid_until' => $validUntil
        ];
    }

    public function approve(Request $request, CertificateRequest $certificateRequest): JsonResponse
    {
        // Authorization: Only captain or admin can approve
        $user = Auth::user();
        if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Only Barangay Captain or Admin can approve certificate requests'
            ], 403);
        }

        // Load the relationship to check if an issued certificate exists
        $certificateRequest->loadMissing('issuedCertificate');

        if (!$certificateRequest->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => $certificateRequest->issuedCertificate 
                    ? 'Certificate has already been issued for this request'
                    : 'Certificate request cannot be approved'
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

        // Get the captain user (if current user is captain, use them; otherwise find captain user)
        $captainUser = $user->isCaptain() ? $user : User::where('role', 'captain')->first();
        
        if (!$captainUser) {
            return response()->json([
                'success' => false,
                'message' => 'No Barangay Captain found in the system'
            ], 400);
        }

        // Check if captain has a signature uploaded
        if (!$captainUser->signature_path) {
            return response()->json([
                'success' => false,
                'message' => 'Barangay Captain signature is not set. Please upload signature first.'
            ], 400);
        }

        // Approve the certificate request
        $certificateRequest->approve($user, $request->remarks);
        
        // Reload the request to get updated relationships
        $certificateRequest->refresh();
        $certificateRequest->load(['resident']);

        // Get default validity dates
        $validityDates = $this->getDefaultValidityDates();

        // Generate certificate number before creating the record to ensure correct sequence
        $tempCertificate = new IssuedCertificate([
            'certificate_type' => $certificateRequest->certificate_type
        ]);
        $certificateNumber = $tempCertificate->generateCertificateNumber();

        // Create the issued certificate with generated certificate number
        $issuedCertificate = IssuedCertificate::create([
            'certificate_request_id' => $certificateRequest->id,
            'resident_id' => $certificateRequest->resident_id,
            'issued_by' => $user->id,
            'certificate_type' => $certificateRequest->certificate_type,
            'certificate_number' => $certificateNumber,
            'purpose' => $certificateRequest->purpose,
            'valid_from' => $validityDates['valid_from'],
            'valid_until' => $validityDates['valid_until'],
            'is_valid' => true,
            'signed_by' => $captainUser->name,
            'signature_position' => 'Punong Barangay',
            'signed_at' => now()
        ]);

        // Generate QR code after certificate is created (needs certificate_number and resident relationship)
        $issuedCertificate->load('resident');
        $issuedCertificate->qr_code = $issuedCertificate->generateQrCode();
        $issuedCertificate->save();

        // Generate PDF with captain's signature
        $pdfService = app(PdfService::class);
        $pdfController = new CertificatePdfController($pdfService);
        $pdfPath = $pdfController->generateCertificatePdf($issuedCertificate);

        if ($pdfPath) {
            $issuedCertificate->pdf_path = $pdfPath;
            $issuedCertificate->save();
        }

        // Reload relationships for response
        $issuedCertificate->load(['resident', 'issuedBy', 'certificateRequest']);

        // Update certificate request status to 'issued' after certificate is generated
        $certificateRequest->update(['status' => 'issued']);

        // Create system notification for admins
        NotificationController::createSystemNotification(
            'Certificate Request Approved & Issued',
            "Certificate request for {$certificateRequest->resident->full_name} has been approved and issued. Certificate Number: {$issuedCertificate->certificate_number}",
            'certificate_approved'
        );

        // Also notify about the issued certificate
        NotificationController::createSystemNotification(
            'Certificate Issued',
            "Certificate {$issuedCertificate->certificate_number} has been issued for {$certificateRequest->resident->full_name}",
            'certificate_issued'
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate request approved and issued successfully',
            'data' => $certificateRequest->load(['resident', 'approvedBy', 'issuedCertificate']),
            'issued_certificate' => $issuedCertificate
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
