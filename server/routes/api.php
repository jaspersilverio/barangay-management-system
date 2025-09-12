<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlotterController;
use App\Http\Controllers\CertificateRequestController;
use App\Http\Controllers\IssuedCertificateController;
use App\Http\Controllers\CertificatePdfController;
use App\Http\Controllers\HouseholdController;
use App\Http\Controllers\LandmarkController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OfficialController;
use App\Http\Controllers\PurokController;
use App\Http\Controllers\PurokBoundaryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ResidentController;
use App\Http\Controllers\DevController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MapMarkerController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

// Public routes (no authentication required)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// CSRF cookie route for cookie-based authentication
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Dev helper (no auth): seed demo data
Route::post('/dev/seed', [DevController::class, 'seed']);



// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/bell', [NotificationController::class, 'bell']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Dashboard routes (all authenticated users can access)
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    Route::get('/dashboard/monthly-registrations', [DashboardController::class, 'monthlyRegistrations']);
    Route::get('/dashboard/vulnerable-trends', [DashboardController::class, 'vulnerableTrends']);
    Route::get('/dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
    Route::get('/dashboard/upcoming-events', [DashboardController::class, 'upcomingEvents']);

    // Read-only routes (all authenticated users)
    Route::middleware('role:admin,purok_leader')->group(function () {
        Route::get('/puroks', [PurokController::class, 'index']);
        Route::get('/puroks/{purok}', [PurokController::class, 'show']);
        Route::get('/households', [HouseholdController::class, 'index']);
        Route::get('/households/for-resident-form', [HouseholdController::class, 'forResidentForm']);
        Route::get('/households/{household}', [HouseholdController::class, 'show']);
        Route::get('/households/{household}/members', [HouseholdController::class, 'members']);
        Route::get('/households/{household}/residents', [HouseholdController::class, 'getResidents']);
        Route::get('/residents', [ResidentController::class, 'index']);
        Route::get('/residents/search', [ResidentController::class, 'search']);
        Route::get('/residents/{resident}', [ResidentController::class, 'show']);
        Route::get('/landmarks', [LandmarkController::class, 'index']);
        Route::get('/landmarks/{landmark}', [LandmarkController::class, 'show']);
        Route::get('/events', [EventController::class, 'index']);
        Route::get('/events/{event}', [EventController::class, 'show']);
        Route::get('/search/households-residents', [SearchController::class, 'searchHouseholdsAndResidents']);
        Route::get('/officials', [OfficialController::class, 'index']);
        Route::get('/officials/active', [OfficialController::class, 'active']);
        Route::get('/officials/{official}', [OfficialController::class, 'show']);
        Route::get('/blotters', [BlotterController::class, 'index']);
        Route::get('/blotters/statistics', [BlotterController::class, 'statistics']);
        Route::get('/blotters/{blotter}', [BlotterController::class, 'show']);
    });

    // Certificate statistics (all authenticated users)
    Route::get('/certificate-requests/statistics', [CertificateRequestController::class, 'statistics']);
    Route::get('/issued-certificates/statistics', [IssuedCertificateController::class, 'statistics']);

    // Certificate routes (purok leaders and admin access)
    Route::middleware('role:purok_leader,admin')->group(function () {
        // Certificate requests
        Route::get('/certificate-requests', [CertificateRequestController::class, 'index']);
        Route::post('/certificate-requests', [CertificateRequestController::class, 'store']);
        Route::get('/certificate-requests/{certificateRequest}', [CertificateRequestController::class, 'show']);
        Route::put('/certificate-requests/{certificateRequest}', [CertificateRequestController::class, 'update']);
        Route::delete('/certificate-requests/{certificateRequest}', [CertificateRequestController::class, 'destroy']);

        // Issued certificates
        Route::get('/issued-certificates', [IssuedCertificateController::class, 'index']);
        Route::post('/issued-certificates', [IssuedCertificateController::class, 'store']);
        Route::get('/issued-certificates/{issuedCertificate}', [IssuedCertificateController::class, 'show']);
        Route::put('/issued-certificates/{issuedCertificate}', [IssuedCertificateController::class, 'update']);
        Route::delete('/issued-certificates/{issuedCertificate}', [IssuedCertificateController::class, 'destroy']);
        Route::post('/issued-certificates/verify', [IssuedCertificateController::class, 'verifyCertificate']);
    });

    // Certificate approval routes (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::post('/certificate-requests/{certificateRequest}/approve', [CertificateRequestController::class, 'approve']);
        Route::post('/certificate-requests/{certificateRequest}/reject', [CertificateRequestController::class, 'reject']);
        Route::post('/certificate-requests/{certificateRequest}/release', [CertificateRequestController::class, 'release']);
        Route::post('/issued-certificates/{issuedCertificate}/invalidate', [IssuedCertificateController::class, 'invalidate']);
        Route::post('/issued-certificates/{issuedCertificate}/regenerate-pdf', [IssuedCertificateController::class, 'regeneratePdf']);
    });

    // PDF routes (all authenticated users)
    Route::get('/certificates/{id}/download', [CertificatePdfController::class, 'downloadCertificate']);
    Route::get('/certificates/{id}/preview', [CertificatePdfController::class, 'previewCertificate']);

    // Test route for debugging
    Route::get('/certificates/{id}/test', function ($id) {
        $certificate = App\Models\IssuedCertificate::find($id);
        if (!$certificate) {
            return response()->json(['success' => false, 'message' => 'Certificate not found'], 404);
        }
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'pdf_path' => $certificate->pdf_path
            ]
        ]);
    });

    // Reports (admin only - purok leaders get filtered data)
    Route::middleware('role:admin')->group(function () {
        Route::get('/reports/households', [ReportController::class, 'households']);
        Route::get('/reports/residents', [ReportController::class, 'residents']);
        Route::get('/reports/puroks', [ReportController::class, 'puroks']);
        Route::get('/reports/population-summary', [ReportController::class, 'populationSummary']);
        Route::get('/reports/vulnerable-groups', [ReportController::class, 'vulnerableGroups']);
        Route::post('/reports/export', [ReportController::class, 'export']);
    });

    // Puroks management (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::post('/puroks', [PurokController::class, 'store']);
        Route::put('/puroks/{purok}', [PurokController::class, 'update']);
        Route::delete('/puroks/{purok}', [PurokController::class, 'destroy']);
    });

    // Landmarks management (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::post('/landmarks', [LandmarkController::class, 'store']);
        Route::put('/landmarks/{landmark}', [LandmarkController::class, 'update']);
        Route::delete('/landmarks/{landmark}', [LandmarkController::class, 'destroy']);
    });

    // Household and Resident management (purok leaders and admin access)
    Route::middleware('role:purok_leader,admin')->group(function () {
        Route::post('/households', [HouseholdController::class, 'store']);
        Route::put('/households/{household}', [HouseholdController::class, 'update']);
        Route::delete('/households/{household}', [HouseholdController::class, 'destroy']);
        Route::post('/residents', [ResidentController::class, 'store']);
        Route::put('/residents/{resident}', [ResidentController::class, 'update']);
        Route::delete('/residents/{resident}', [ResidentController::class, 'destroy']);
        Route::post('/residents/link-to-household', [ResidentController::class, 'linkToHousehold']);
    });

    // Events management (purok leaders and admin access)
    Route::middleware('role:purok_leader,admin')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
    });

    // Blotter management (purok leaders and admin access)
    Route::middleware('role:purok_leader,admin')->group(function () {
        Route::post('/blotters', [BlotterController::class, 'store']);
        Route::put('/blotters/{blotter}', [BlotterController::class, 'update']);
        Route::delete('/blotters/{blotter}', [BlotterController::class, 'destroy']);
    });

    // Audit logs (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);

        // Blotter archive (admin only)
        Route::get('/blotters/archived', [BlotterController::class, 'archived']);
        Route::post('/blotters/verify-archive-password', [BlotterController::class, 'verifyArchivePassword']);
        Route::post('/blotters/{blotter}/restore', [BlotterController::class, 'restore']);
        Route::delete('/blotters/{blotter}/force-delete', [BlotterController::class, 'forceDelete']);
    });

    // Household archive (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/households/archived', [HouseholdController::class, 'archived']);
        Route::post('/households/verify-archive-password', [HouseholdController::class, 'verifyArchivePassword']);
        Route::post('/households/{household}/restore', [HouseholdController::class, 'restore']);
        Route::delete('/households/{household}/force-delete', [HouseholdController::class, 'forceDelete']);
    });

    // Map markers routes (all authenticated users can view, admin can CRUD)
    Route::get('/map/markers', [MapMarkerController::class, 'index']);
    Route::get('/map/markers/types', [MapMarkerController::class, 'getTypeOptions']);

    // Admin only map marker management
    Route::middleware('role:admin')->group(function () {
        Route::post('/map/markers', [MapMarkerController::class, 'store']);
        Route::get('/map/markers/{mapMarker}', [MapMarkerController::class, 'show']);
        Route::put('/map/markers/{mapMarker}', [MapMarkerController::class, 'update']);
        Route::delete('/map/markers/{mapMarker}', [MapMarkerController::class, 'destroy']);
        Route::post('/map/markers/{mapMarker}/assign-household', [MapMarkerController::class, 'assignHousehold']);
        Route::delete('/map/markers/{mapMarker}/remove-household', [MapMarkerController::class, 'removeHousehold']);
    });

    // Map marker with household details (all authenticated users)
    Route::get('/map/markers/{mapMarker}/with-household', [MapMarkerController::class, 'showWithHousehold']);

    // Admin only routes
    Route::middleware('role:admin')->group(function () {
        // User management
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/roles', [UserController::class, 'getRoles']);
        Route::get('/users/puroks', [UserController::class, 'getPuroks']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        // Officials management
        Route::post('/officials', [OfficialController::class, 'store']);
        Route::put('/officials/{official}', [OfficialController::class, 'update']);
        Route::delete('/officials/{official}', [OfficialController::class, 'destroy']);
        Route::patch('/officials/{official}/toggle-active', [OfficialController::class, 'toggleActive']);

        // Settings management
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings/barangay-info', [SettingsController::class, 'updateBarangayInfo']);
        Route::put('/settings/preferences', [SettingsController::class, 'updatePreferences']);
        Route::put('/settings/emergency', [SettingsController::class, 'updateEmergency']);

        // Purok boundaries management (admin only)
        Route::apiResource('purok-boundaries', PurokBoundaryController::class);
    });

    // Purok summary endpoint (accessible to all authenticated users)
    Route::get('/puroks/{id}/summary', [PurokController::class, 'summary']);
});
