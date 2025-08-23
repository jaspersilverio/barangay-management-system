<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::query();

        // Filter by upcoming events only by default
        if ($request->get('upcoming', true)) {
            $query->upcoming();
        }

        $events = $query->orderByDate()->get();

        return response()->json([
            'success' => true,
            'data' => $events,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {


        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Custom validation for date
        $validator->after(function ($validator) use ($request) {
            $date = $request->input('date');
            if ($date && strtotime($date) < strtotime(date('Y-m-d'))) {
                $validator->errors()->add('date', 'The event date must be today or a future date.');
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $event = Event::create([
            'title' => $request->title,
            'date' => $request->date,
            'location' => $request->location,
            'description' => $request->description,
            'created_by' => null, // Since auth is disabled
        ]);

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => 'Event created successfully',
            'errors' => null,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Event not found',
                'errors' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Event not found',
                'errors' => null,
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Custom validation for date
        $validator->after(function ($validator) use ($request) {
            $date = $request->input('date');
            if ($date && strtotime($date) < strtotime(date('Y-m-d'))) {
                $validator->errors()->add('date', 'The event date must be today or a future date.');
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $event->update([
            'title' => $request->title,
            'date' => $request->date,
            'location' => $request->location,
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => 'Event updated successfully',
            'errors' => null,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Event not found',
                'errors' => null,
            ], 404);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Event deleted successfully',
            'errors' => null,
        ]);
    }
}
