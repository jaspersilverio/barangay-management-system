<?php

namespace App\Http\Controllers;

use App\Http\Requests\IncidentReport\StoreIncidentReportRequest;
use App\Http\Requests\IncidentReport\UpdateIncidentReportRequest;
use App\Models\IncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
                'updater:id,name'
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
