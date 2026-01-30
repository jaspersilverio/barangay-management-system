<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlotterController;
use App\Http\Controllers\CertificateRequestController;
use App\Http\Controllers\IssuedCertificateController;
use App\Http\Controllers\CertificatePdfController;
use App\Http\Controllers\PdfExportController;
use App\Http\Controllers\HouseholdController;
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
use App\Http\Controllers\BarangayInfoController;
use App\Http\Controllers\MapMarkerController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\VaccinationController;
use App\Http\Controllers\FourPsBeneficiaryController;
use App\Http\Controllers\SoloParentController;
use App\Http\Controllers\IncidentReportController;
use App\Http\Controllers\ApprovalQueueController;
use Illuminate\Support\Facades\Route;

// Public routes (no authentication required)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// Public image serving route with CORS headers
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!file_exists($fullPath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath);

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET',
        'Access-Control-Allow-Headers' => 'Content-Type',
    ]);
})->where('path', '.*');

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
    Route::get('/dashboard/vaccinations/summary', [DashboardController::class, 'vaccinationSummary']);
    Route::get('/dashboard/blotters/summary', [DashboardController::class, 'blotterSummary']);
    Route::get('/dashboard/age-distribution', [DashboardController::class, 'ageDistribution']);
    Route::get('/dashboard/beneficiaries', [DashboardController::class, 'beneficiaries']);

    // Read-only routes (staff, purok leaders, captain, and admin access)
    Route::middleware('role:admin,captain,purok_leader,staff')->group(function () {
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
        Route::get('/events', [EventController::class, 'index']);
        Route::get('/events/{event}', [EventController::class, 'show']);
        Route::get('/search/households-residents', [SearchController::class, 'searchHouseholdsAndResidents']);
        Route::get('/officials', [OfficialController::class, 'index']);
        Route::get('/officials/active', [OfficialController::class, 'active']);
        Route::get('/officials/{official}', [OfficialController::class, 'show']);
        Route::get('/blotters', [BlotterController::class, 'index']);
        Route::get('/blotters/statistics', [BlotterController::class, 'statistics']);
        Route::get('/blotters/{blotter}', [BlotterController::class, 'show']);
        Route::get('/incident-reports', [IncidentReportController::class, 'index']);
        Route::get('/incident-reports/{incidentReport}', [IncidentReportController::class, 'show']);
        Route::get('/beneficiaries/4ps', [FourPsBeneficiaryController::class, 'index']);
        Route::get('/beneficiaries/4ps/{fourPs}', [FourPsBeneficiaryController::class, 'show']);
        Route::get('/beneficiaries/solo-parents', [SoloParentController::class, 'index']);
        Route::get('/beneficiaries/solo-parents/{soloParent}', [SoloParentController::class, 'show']);
    });

    // Certificate statistics (all authenticated users)
    Route::get('/certificate-requests/statistics', [CertificateRequestController::class, 'statistics']);
    Route::get('/issued-certificates/statistics', [IssuedCertificateController::class, 'statistics']);

    // Certificate routes (staff, purok leaders, captain, and admin access)
    Route::middleware('role:purok_leader,admin,captain,staff')->group(function () {
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

    // Approval queue routes (captain and admin only)
    Route::middleware('role:captain,admin')->group(function () {
        Route::get('/approval-queue', [ApprovalQueueController::class, 'index']);
        Route::get('/approval-queue/pending-count', [ApprovalQueueController::class, 'pendingCount']);
    });

    // Certificate approval routes (captain and admin)
    Route::middleware('role:captain,admin')->group(function () {
        Route::post('/certificate-requests/{certificateRequest}/approve', [CertificateRequestController::class, 'approve']);
        Route::post('/certificate-requests/{certificateRequest}/reject', [CertificateRequestController::class, 'reject']);
        Route::post('/certificate-requests/{certificateRequest}/release', [CertificateRequestController::class, 'release']);
        Route::post('/issued-certificates/{issuedCertificate}/invalidate', [IssuedCertificateController::class, 'invalidate']);
        Route::post('/issued-certificates/{issuedCertificate}/regenerate-pdf', [IssuedCertificateController::class, 'regeneratePdf']);
    });

    // Blotter approval routes (captain and admin only)
    Route::middleware('role:captain,admin')->group(function () {
        Route::post('/blotters/{blotter}/approve', [BlotterController::class, 'approve']);
        Route::post('/blotters/{blotter}/reject', [BlotterController::class, 'reject']);
    });

    // Incident Report approval routes (captain and admin only)
    Route::middleware('role:captain,admin')->group(function () {
        Route::post('/incident-reports/{incidentReport}/approve', [IncidentReportController::class, 'approve']);
        Route::post('/incident-reports/{incidentReport}/reject', [IncidentReportController::class, 'reject']);
    });

    // PDF routes (all authenticated users)
    Route::get('/certificates/{id}/download', [CertificatePdfController::class, 'downloadCertificate']);
    Route::get('/certificates/{id}/preview', [CertificatePdfController::class, 'previewCertificate']);

    // PDF Export routes (authorized users)
    Route::middleware('role:admin,captain,staff,purok_leader')->group(function () {
        Route::get('/pdf/export/residents', [PdfExportController::class, 'exportResidents']);
        Route::get('/pdf/export/households', [PdfExportController::class, 'exportHouseholds']);
        Route::get('/pdf/export/blotters', [PdfExportController::class, 'exportBlotters']);
        Route::get('/excel/export/blotters', [PdfExportController::class, 'exportBlottersExcel']);
        Route::get('/pdf/export/solo-parents', [PdfExportController::class, 'exportSoloParents']);
        Route::get('/pdf/export/puroks', [PdfExportController::class, 'exportPuroks']);
        Route::get('/pdf/export/vaccinations', [PdfExportController::class, 'exportVaccinations']);
        Route::get('/excel/export/vaccinations', [PdfExportController::class, 'exportVaccinationsExcel']);
    });


    // Reports (admin and captain only - purok leaders get filtered data)
    Route::middleware('role:admin,captain')->group(function () {
        Route::get('/reports/households', [ReportController::class, 'households']);
        Route::get('/reports/residents', [ReportController::class, 'residents']);
        Route::get('/reports/population-summary', [ReportController::class, 'populationSummary']);
        Route::get('/reports/vulnerable-groups', [ReportController::class, 'vulnerableGroups']);
        Route::get('/reports/households/export/csv', [ReportController::class, 'exportHouseholdsCsv']);
        Route::get('/reports/residents/export/csv', [ReportController::class, 'exportResidentsCsv']);
    });

    // Puroks report (admin, captain, and purok leaders - purok leaders get filtered data)
    Route::middleware('role:admin,captain,purok_leader')->group(function () {
        Route::get('/reports/puroks', [ReportController::class, 'puroks']);
        Route::get('/reports/puroks/export/csv', [ReportController::class, 'exportPuroksCsv']);
    });

    // Solo Parents report CSV export (admin, captain, staff, and purok leaders - purok leaders get filtered data)
    Route::middleware('role:admin,captain,staff,purok_leader')->group(function () {
        Route::get('/reports/solo-parents/export/csv', [ReportController::class, 'exportSoloParentsCsv']);
    });

    // Puroks management (admin and captain)
    Route::middleware('role:admin,captain')->group(function () {
        Route::post('/puroks', [PurokController::class, 'store']);
        Route::put('/puroks/{purok}', [PurokController::class, 'update']);
        Route::delete('/puroks/{purok}', [PurokController::class, 'destroy']);
    });

    // Household and Resident management (purok leaders, captain, and admin access)
    Route::middleware('role:purok_leader,admin,captain')->group(function () {
        Route::post('/households', [HouseholdController::class, 'store']);
        Route::put('/households/{household}', [HouseholdController::class, 'update']);
        Route::delete('/households/{household}', [HouseholdController::class, 'destroy']);
        Route::post('/residents', [ResidentController::class, 'store']);
        Route::put('/residents/{resident}', [ResidentController::class, 'update']);
        Route::delete('/residents/{resident}', [ResidentController::class, 'destroy']);
        Route::post('/residents/link-to-household', [ResidentController::class, 'linkToHousehold']);
    });

    // 4Ps Beneficiaries management (staff, captain, and admin access)
    Route::middleware('role:staff,admin,captain')->group(function () {
        Route::post('/beneficiaries/4ps', [FourPsBeneficiaryController::class, 'store']);
        Route::put('/beneficiaries/4ps/{fourPs}', [FourPsBeneficiaryController::class, 'update']);
        Route::delete('/beneficiaries/4ps/{fourPs}', [FourPsBeneficiaryController::class, 'destroy']);
    });

    // Solo Parents management (staff, captain, and admin access)
    Route::middleware('role:staff,admin,captain')->group(function () {
        Route::post('/beneficiaries/solo-parents', [SoloParentController::class, 'store']);
        Route::put('/beneficiaries/solo-parents/{soloParent}', [SoloParentController::class, 'update']);
        Route::delete('/beneficiaries/solo-parents/{soloParent}', [SoloParentController::class, 'destroy']);
        Route::post('/beneficiaries/solo-parents/{soloParent}/generate-certificate', [SoloParentController::class, 'generateCertificate']);
    });

    // Events management (purok leaders, captain, and admin access)
    Route::middleware('role:purok_leader,admin,captain')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
    });

    // Blotter creation (staff, purok leaders, and admin can create)
    Route::middleware('role:purok_leader,admin,staff')->group(function () {
        Route::post('/blotters', [BlotterController::class, 'store']);
    });

    // Blotter management (purok leaders, captain, and admin access - update/delete only)
    Route::middleware('role:purok_leader,admin,captain')->group(function () {
        Route::put('/blotters/{blotter}', [BlotterController::class, 'update']);
        Route::delete('/blotters/{blotter}', [BlotterController::class, 'destroy']);
    });

    // Incident Reports creation (staff, purok leaders, and admin can create)
    Route::middleware('role:purok_leader,admin,staff')->group(function () {
        Route::post('/incident-reports', [IncidentReportController::class, 'store']);
    });

    // Incident Reports management (purok leaders, captain, and admin access - update/delete only)
    Route::middleware('role:purok_leader,admin,captain')->group(function () {
        Route::put('/incident-reports/{incidentReport}', [IncidentReportController::class, 'update']);
        Route::delete('/incident-reports/{incidentReport}', [IncidentReportController::class, 'destroy']);
    });

    // Audit logs (admin and captain)
    Route::middleware('role:admin,captain')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });


    // Map markers routes (all authenticated users can view, admin can CRUD)
    Route::get('/map/markers', [MapMarkerController::class, 'index']);
    Route::get('/map/markers/types', [MapMarkerController::class, 'getTypeOptions']);

    // Map marker management (admin and captain)
    Route::middleware('role:admin,captain')->group(function () {
        Route::post('/map/markers', [MapMarkerController::class, 'store']);
        Route::get('/map/markers/{mapMarker}', [MapMarkerController::class, 'show']);
        Route::put('/map/markers/{mapMarker}', [MapMarkerController::class, 'update']);
        Route::delete('/map/markers/{mapMarker}', [MapMarkerController::class, 'destroy']);
        Route::post('/map/markers/{mapMarker}/assign-household', [MapMarkerController::class, 'assignHousehold']);
        Route::delete('/map/markers/{mapMarker}/remove-household', [MapMarkerController::class, 'removeHousehold']);
    });

    // Map marker with household details (all authenticated users)
    Route::get('/map/markers/{mapMarker}/with-household', [MapMarkerController::class, 'showWithHousehold']);

    // User management (admin only - captain cannot create users)
    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [UserController::class, 'store']); // Only admin can create users
    });

    // User management routes (admin and captain - except creation)
    Route::middleware('role:admin,captain')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/roles', [UserController::class, 'getRoles']);
        Route::get('/users/puroks', [UserController::class, 'getPuroks']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        // Captain signature routes (captain and admin)
        Route::post('/users/captain/signature', [UserController::class, 'uploadSignature']);
        Route::get('/users/captain/signature', [UserController::class, 'getSignature']);

        // Officials management
        Route::post('/officials', [OfficialController::class, 'store']);
        Route::put('/officials/{official}', [OfficialController::class, 'update']);
        Route::delete('/officials/{official}', [OfficialController::class, 'destroy']);
        Route::patch('/officials/{official}/toggle-active', [OfficialController::class, 'toggleActive']);

        // Settings management
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings/preferences', [SettingsController::class, 'updatePreferences']);
        Route::put('/settings/emergency', [SettingsController::class, 'updateEmergency']);

        // Barangay Information (singleton)
        Route::get('/barangay-info', [BarangayInfoController::class, 'show']);
        Route::post('/barangay-info', [BarangayInfoController::class, 'store']);

        // Purok boundaries management (admin and captain)
        Route::apiResource('purok-boundaries', PurokBoundaryController::class);
    });

    // Vaccination routes (purok leaders, captain, and admin access)
    Route::middleware('role:purok_leader,admin,captain')->group(function () {
        Route::get('/vaccinations', [VaccinationController::class, 'index']);
        Route::post('/vaccinations', [VaccinationController::class, 'store']);
        Route::get('/vaccinations/statistics', [VaccinationController::class, 'statistics']);
        Route::get('/vaccinations/{vaccination}', [VaccinationController::class, 'show']);
        Route::put('/vaccinations/{vaccination}', [VaccinationController::class, 'update']);
        Route::post('/vaccinations/{vaccination}/complete', [VaccinationController::class, 'complete']);
        Route::delete('/vaccinations/{vaccination}', [VaccinationController::class, 'destroy']);
    });

    // Resident vaccination routes (all authenticated users can view, purok leaders and admin can manage)
    Route::get('/residents/{resident}/vaccinations', [VaccinationController::class, 'getResidentVaccinations']);

    // Purok summary endpoint (accessible to all authenticated users)
    Route::get('/puroks/{id}/summary', [PurokController::class, 'summary']);
});
