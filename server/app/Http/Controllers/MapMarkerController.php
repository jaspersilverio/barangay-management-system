<?php

namespace App\Http\Controllers;

use App\Models\MapMarker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class MapMarkerController extends Controller
{
    /**
     * Display a listing of map markers.
     */
    public function index(): JsonResponse
    {
        $markers = MapMarker::with(['creator:id,name', 'household.purok', 'household.residents'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $markers,
        ]);
    }

    /**
     * Store a newly created map marker.
     */
    public function store(Request $request): JsonResponse
    {
        // Allow admin, captain, and staff to create markers
        if (!in_array(Auth::user()->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to create markers.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', 'string', Rule::in(array_keys(MapMarker::getTypeOptions()))],
            'description' => 'nullable|string|max:1000',
            'x_position' => 'required|numeric|min:0',
            'y_position' => 'required|numeric|min:0',
        ]);

        $marker = MapMarker::create([
            ...$validated,
            'created_by' => Auth::id(),
        ]);

        $marker->load('creator:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Marker created successfully.',
            'data' => $marker,
        ], 201);
    }

    /**
     * Display the specified map marker.
     */
    public function show(MapMarker $mapMarker): JsonResponse
    {
        $mapMarker->load(['creator:id,name', 'household.purok', 'household.residents']);

        return response()->json([
            'success' => true,
            'data' => $mapMarker,
        ]);
    }

    /**
     * Update the specified map marker.
     */
    public function update(Request $request, MapMarker $mapMarker): JsonResponse
    {
        // Allow admin, captain, and staff to update markers
        if (!in_array(Auth::user()->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to update markers.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => ['sometimes', 'required', 'string', Rule::in(array_keys(MapMarker::getTypeOptions()))],
            'description' => 'nullable|string|max:1000',
            'x_position' => 'sometimes|required|numeric|min:0',
            'y_position' => 'sometimes|required|numeric|min:0',
        ]);

        $mapMarker->update($validated);
        $mapMarker->load('creator:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Marker updated successfully.',
            'data' => $mapMarker,
        ]);
    }

    /**
     * Remove the specified map marker.
     */
    public function destroy(MapMarker $mapMarker): JsonResponse
    {
        // Allow admin, captain, and staff to delete markers
        if (!in_array(Auth::user()->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to delete markers.',
            ], 403);
        }

        $mapMarker->delete();

        return response()->json([
            'success' => true,
            'message' => 'Marker deleted successfully.',
        ]);
    }

    /**
     * Get marker type options.
     */
    public function getTypeOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => MapMarker::getTypeOptions(),
        ]);
    }

    /**
     * Assign a household to a marker.
     */
    public function assignHousehold(Request $request, MapMarker $mapMarker): JsonResponse
    {
        // Allow admin, captain, and staff to assign households to markers
        if (!in_array(Auth::user()->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to assign households.',
            ], 403);
        }

        $validated = $request->validate([
            'household_id' => 'required|exists:households,id',
        ]);

        $mapMarker->update(['household_id' => $validated['household_id']]);
        $mapMarker->load(['creator:id,name', 'household.purok', 'household.residents']);

        return response()->json([
            'success' => true,
            'message' => 'Household assigned successfully.',
            'data' => $mapMarker,
        ]);
    }

    /**
     * Remove household assignment from a marker.
     */
    public function removeHousehold(MapMarker $mapMarker): JsonResponse
    {
        // Allow admin, captain, and staff to remove household assignments
        if (!in_array(Auth::user()->role, ['admin', 'captain', 'staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to remove household assignments.',
            ], 403);
        }

        $mapMarker->update(['household_id' => null]);
        $mapMarker->load('creator:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Household assignment removed successfully.',
            'data' => $mapMarker,
        ]);
    }

    /**
     * Get marker with household details.
     */
    public function showWithHousehold(MapMarker $mapMarker): JsonResponse
    {
        $mapMarker->load(['creator:id,name', 'household.purok', 'household.residents']);

        return response()->json([
            'success' => true,
            'data' => $mapMarker,
        ]);
    }
}
