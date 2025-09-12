<?php

namespace App\Http\Controllers;

use App\Models\PurokBoundary;
use App\Models\Purok;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PurokBoundaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $boundaries = PurokBoundary::with(['purok', 'creator'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($boundaries);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'points' => 'required|array|min:3',
            'points.*.x' => 'required|numeric|min:0|max:100',
            'points.*.y' => 'required|numeric|min:0|max:100',
            'purok_id' => 'nullable|exists:puroks,id'
        ]);

        $boundary = new PurokBoundary([
            'points' => $request->points,
            'purok_id' => $request->purok_id,
            'created_by' => Auth::id()
        ]);

        $boundary->calculateCentroid();
        $boundary->save();

        return response()->json($boundary->load(['purok', 'creator']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $boundary = PurokBoundary::with(['purok', 'creator', 'updater'])
            ->findOrFail($id);

        return response()->json($boundary);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $boundary = PurokBoundary::findOrFail($id);

        $request->validate([
            'points' => 'sometimes|array|min:3',
            'points.*.x' => 'required_with:points|numeric|min:0|max:100',
            'points.*.y' => 'required_with:points|numeric|min:0|max:100',
            'purok_id' => 'nullable|exists:puroks,id'
        ]);

        $boundary->fill($request->only(['points', 'purok_id']));
        $boundary->updated_by = Auth::id();

        if ($request->has('points')) {
            $boundary->calculateCentroid();
        }

        $boundary->save();

        return response()->json($boundary->load(['purok', 'creator', 'updater']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $boundary = PurokBoundary::findOrFail($id);
        $boundary->delete();

        return response()->json(['message' => 'Boundary deleted successfully']);
    }
}
