<?php

namespace App\Http\Controllers;

use App\Models\IssuedCertificate;
use App\Models\CertificateRequest;
use App\Models\Resident;
use App\Http\Controllers\CertificatePdfController;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class IssuedCertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = IssuedCertificate::with(['resident', 'issuedBy', 'certificateRequest']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'valid') {
                $query->valid();
            } elseif ($request->status === 'expired') {
                $query->expired();
            }
        }

        // Filter by certificate type
        if ($request->has('certificate_type') && $request->certificate_type !== 'all') {
            $query->byType($request->certificate_type);
        }

        // Filter by resident
        if ($request->has('resident_id')) {
            $query->where('resident_id', $request->resident_id);
        }

        // Search by resident name or certificate number
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('certificate_number', 'like', "%{$search}%")
                    ->orWhereHas('resident', function ($residentQuery) use ($search) {
                        $residentQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        // Date range filter
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $certificates = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $certificates
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'certificate_request_id' => 'required|exists:certificate_requests,id',
            'resident_id' => 'required|exists:residents,id',
            'certificate_type' => 'required|in:barangay_clearance,indigency,residency,business_permit_endorsement',
            'purpose' => 'required|string|max:500',
            'valid_from' => 'required|date',
            'valid_until' => 'required|date|after:valid_from',
            'signed_by' => 'required|string|max:255',
            'signature_position' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if certificate request exists and is approved
        $certificateRequest = CertificateRequest::find($request->certificate_request_id);
        if (!$certificateRequest || $certificateRequest->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Certificate request not found or not approved'
            ], 400);
        }

        // Create the issued certificate
        $certificate = IssuedCertificate::create([
            'certificate_request_id' => $request->certificate_request_id,
            'resident_id' => $request->resident_id,
            'issued_by' => Auth::id(),
            'certificate_type' => $request->certificate_type,
            'certificate_number' => '', // Will be generated
            'purpose' => $request->purpose,
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
            'is_valid' => true,
            'signed_by' => $request->signed_by,
            'signature_position' => $request->signature_position,
            'signed_at' => now()
        ]);

        // Generate certificate number and QR code
        $certificate->certificate_number = $certificate->generateCertificateNumber();
        $certificate->qr_code = $certificate->generateQrCode();
        $certificate->save();

        // Generate PDF
        $pdfService = app(\App\Services\PdfService::class);
        $pdfController = new CertificatePdfController($pdfService);
        $pdfPath = $pdfController->generateCertificatePdf($certificate);

        if ($pdfPath) {
            $certificate->pdf_path = $pdfPath;
            $certificate->save();
        }

        // Update certificate request status to released
        $certificateRequest->release(Auth::user());

        // Create system notification for admins
        NotificationController::createSystemNotification(
            'Certificate Issued',
            "Certificate {$certificate->certificate_number} has been issued for {$certificate->resident->full_name}",
            'certificate_issued'
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate issued successfully',
            'data' => $certificate->load(['resident', 'issuedBy', 'certificateRequest'])
        ], 201);
    }

    public function show(IssuedCertificate $issuedCertificate): JsonResponse
    {
        $issuedCertificate->load(['resident', 'issuedBy', 'certificateRequest']);

        return response()->json([
            'success' => true,
            'data' => $issuedCertificate
        ]);
    }

    public function update(Request $request, IssuedCertificate $issuedCertificate): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'purpose' => 'sometimes|required|string|max:500',
            'valid_from' => 'sometimes|required|date',
            'valid_until' => 'sometimes|required|date|after:valid_from',
            'is_valid' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $issuedCertificate->update($request->only(['purpose', 'valid_from', 'valid_until', 'is_valid']));

        return response()->json([
            'success' => true,
            'message' => 'Certificate updated successfully',
            'data' => $issuedCertificate->load(['resident', 'issuedBy'])
        ]);
    }

    public function destroy(IssuedCertificate $issuedCertificate): JsonResponse
    {
        // Delete PDF file if exists
        if ($issuedCertificate->pdf_path && Storage::disk('public')->exists($issuedCertificate->pdf_path)) {
            Storage::disk('public')->delete($issuedCertificate->pdf_path);
        }

        $issuedCertificate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Certificate deleted successfully'
        ]);
    }

    public function downloadPdf(IssuedCertificate $issuedCertificate): JsonResponse
    {
        if (!$issuedCertificate->pdf_path) {
            return response()->json([
                'success' => false,
                'message' => 'PDF not found'
            ], 404);
        }

        if (!Storage::disk('public')->exists($issuedCertificate->pdf_path)) {
            return response()->json([
                'success' => false,
                'message' => 'PDF file not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'download_url' => config('app.url') . '/storage/' . $issuedCertificate->pdf_path,
                'filename' => basename($issuedCertificate->pdf_path)
            ]
        ]);
    }

    public function invalidate(IssuedCertificate $issuedCertificate): JsonResponse
    {
        try {
            // Load relationships first
            $issuedCertificate->load(['resident', 'issuedBy']);

            $issuedCertificate->invalidate();

            // Create system notification for admins
            NotificationController::createSystemNotification(
                'Certificate Invalidated',
                "Certificate {$issuedCertificate->certificate_number} has been invalidated for {$issuedCertificate->resident->full_name}",
                'certificate_invalidated'
            );

            return response()->json([
                'success' => true,
                'message' => 'Certificate invalidated successfully',
                'data' => $issuedCertificate
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to invalidate certificate: ' . $e->getMessage()
            ], 500);
        }
    }

    public function statistics(): JsonResponse
    {
        $stats = [
            'total_certificates' => IssuedCertificate::count(),
            'valid_certificates' => IssuedCertificate::valid()->count(),
            'expired_certificates' => IssuedCertificate::expired()->count(),
            'by_type' => [
                'barangay_clearance' => IssuedCertificate::byType('barangay_clearance')->count(),
                'indigency' => IssuedCertificate::byType('indigency')->count(),
                'residency' => IssuedCertificate::byType('residency')->count(),
                'business_permit_endorsement' => IssuedCertificate::byType('business_permit_endorsement')->count(),
            ],
            'expiring_soon' => IssuedCertificate::valid()
                ->where('valid_until', '<=', now()->addDays(30))
                ->where('valid_until', '>', now())
                ->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    public function verifyCertificate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'certificate_number' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $certificate = IssuedCertificate::where('certificate_number', $request->certificate_number)
            ->with(['resident', 'issuedBy'])
            ->first();

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'certificate' => $certificate,
                'is_valid' => $certificate->isValid(),
                'status' => $certificate->status,
                'days_until_expiry' => $certificate->days_until_expiry
            ]
        ]);
    }
}
