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
use Illuminate\Support\Facades\Route;

// For development/demo: expose essentials without auth middleware
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);

Route::get('/puroks', [PurokController::class, 'index']);
Route::post('/puroks', [PurokController::class, 'store']);
Route::get('/puroks/{purok}', [PurokController::class, 'show']);
Route::put('/puroks/{purok}', [PurokController::class, 'update']);
Route::delete('/puroks/{purok}', [PurokController::class, 'destroy']);

Route::get('/households', [HouseholdController::class, 'index']);
Route::post('/households', [HouseholdController::class, 'store']);
Route::get('/households/{household}', [HouseholdController::class, 'show']);
Route::put('/households/{household}', [HouseholdController::class, 'update']);
Route::delete('/households/{household}', [HouseholdController::class, 'destroy']);
Route::get('/households/{household}/members', [HouseholdController::class, 'members']);

Route::get('/residents', [ResidentController::class, 'index']);
Route::post('/residents', [ResidentController::class, 'store']);
Route::get('/residents/{resident}', [ResidentController::class, 'show']);
Route::put('/residents/{resident}', [ResidentController::class, 'update']);
Route::delete('/residents/{resident}', [ResidentController::class, 'destroy']);

Route::get('/landmarks', [LandmarkController::class, 'index']);
Route::post('/landmarks', [LandmarkController::class, 'store']);
Route::get('/landmarks/{landmark}', [LandmarkController::class, 'show']);
Route::put('/landmarks/{landmark}', [LandmarkController::class, 'update']);
Route::delete('/landmarks/{landmark}', [LandmarkController::class, 'destroy']);

// Reports
Route::get('/reports/households', [ReportController::class, 'households']);
Route::get('/reports/residents', [ReportController::class, 'residents']);
Route::get('/reports/puroks', [ReportController::class, 'puroks']);
Route::get('/reports/population-summary', [ReportController::class, 'populationSummary']);
Route::get('/reports/vulnerable-groups', [ReportController::class, 'vulnerableGroups']);
Route::post('/reports/export', [ReportController::class, 'export']);

Route::get('/audit-logs', [AuditLogController::class, 'index']);
Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);

// Dev helper (no auth): seed demo data
Route::post('/dev/seed', [DevController::class, 'seed']);

// Dashboard summary
Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
Route::get('/dashboard/monthly-registrations', [DashboardController::class, 'monthlyRegistrations']);
Route::get('/dashboard/vulnerable-trends', [DashboardController::class, 'vulnerableTrends']);
Route::get('/dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
Route::get('/dashboard/upcoming-events', [DashboardController::class, 'upcomingEvents']);

// Events management
Route::apiResource('events', EventController::class);

// User management
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);
Route::post('/users/{id}/restore', [UserController::class, 'restore']);
Route::get('/users/roles', [UserController::class, 'getRoles']);
Route::get('/users/puroks', [UserController::class, 'getPuroks']);
