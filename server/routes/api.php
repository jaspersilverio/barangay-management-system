<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HouseholdController;
use App\Http\Controllers\LandmarkController;
use App\Http\Controllers\PurokController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ResidentController;
use App\Http\Controllers\DevController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Public routes (no authentication required)
Route::post('/auth/login', [AuthController::class, 'login']);

// Dev helper (no auth): seed demo data
Route::post('/dev/seed', [DevController::class, 'seed']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Dashboard routes (all authenticated users can access)
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    Route::get('/dashboard/monthly-registrations', [DashboardController::class, 'monthlyRegistrations']);
    Route::get('/dashboard/vulnerable-trends', [DashboardController::class, 'vulnerableTrends']);
    Route::get('/dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
    Route::get('/dashboard/upcoming-events', [DashboardController::class, 'upcomingEvents']);

    // Read-only routes (viewer access)
    Route::middleware('role:viewer,staff,purok_leader,admin')->group(function () {
        Route::get('/puroks', [PurokController::class, 'index']);
        Route::get('/puroks/{purok}', [PurokController::class, 'show']);
        Route::get('/households', [HouseholdController::class, 'index']);
        Route::get('/households/for-resident-form', [HouseholdController::class, 'forResidentForm']);
        Route::get('/households/{household}', [HouseholdController::class, 'show']);
        Route::get('/households/{household}/members', [HouseholdController::class, 'members']);
        Route::get('/households/{household}/residents', [HouseholdController::class, 'getResidents']);
        Route::get('/residents', [ResidentController::class, 'index']);
        Route::get('/residents/{resident}', [ResidentController::class, 'show']);
        Route::get('/landmarks', [LandmarkController::class, 'index']);
        Route::get('/landmarks/{landmark}', [LandmarkController::class, 'show']);
        Route::get('/events', [EventController::class, 'index']);
        Route::get('/events/{event}', [EventController::class, 'show']);
    });

    // Reports (viewer access)
    Route::middleware('role:viewer,staff,purok_leader,admin')->group(function () {
        Route::get('/reports/households', [ReportController::class, 'households']);
        Route::get('/reports/residents', [ReportController::class, 'residents']);
        Route::get('/reports/puroks', [ReportController::class, 'puroks']);
        Route::get('/reports/population-summary', [ReportController::class, 'populationSummary']);
        Route::get('/reports/vulnerable-groups', [ReportController::class, 'vulnerableGroups']);
        Route::post('/reports/export', [ReportController::class, 'export']);
    });

    // Audit logs (staff and admin access)
    Route::middleware('role:staff,admin')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });

    // CRUD operations (staff and admin access)
    Route::middleware('role:staff,admin')->group(function () {
        // Puroks management
        Route::post('/puroks', [PurokController::class, 'store']);
        Route::put('/puroks/{purok}', [PurokController::class, 'update']);
        Route::delete('/puroks/{purok}', [PurokController::class, 'destroy']);

        // Landmarks management
        Route::post('/landmarks', [LandmarkController::class, 'store']);
        Route::put('/landmarks/{landmark}', [LandmarkController::class, 'update']);
        Route::delete('/landmarks/{landmark}', [LandmarkController::class, 'destroy']);

        // Events management
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
    });

    // Household and Resident management (purok leaders, staff, and admin access)
    Route::middleware('role:purok_leader,staff,admin')->group(function () {
        Route::post('/households', [HouseholdController::class, 'store']);
        Route::put('/households/{household}', [HouseholdController::class, 'update']);
        Route::delete('/households/{household}', [HouseholdController::class, 'destroy']);
        Route::post('/residents', [ResidentController::class, 'store']);
        Route::put('/residents/{resident}', [ResidentController::class, 'update']);
        Route::delete('/residents/{resident}', [ResidentController::class, 'destroy']);
    });

    // Events management (purok leaders, staff, and admin access)
    Route::middleware('role:purok_leader,staff,admin')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
    });

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

        // Settings management
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings/barangay-info', [SettingsController::class, 'updateBarangayInfo']);
        Route::put('/settings/preferences', [SettingsController::class, 'updatePreferences']);
        Route::put('/settings/emergency', [SettingsController::class, 'updateEmergency']);
    });
});
