<?php

namespace App\Http\Controllers;

use App\Http\Controllers\NotificationController;
use App\Models\Event;
use App\Models\User;
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
        $user = $request->user();

        // Role-based filtering
        if ($user->isPurokLeader()) {
            // Purok leaders can only see events from their assigned purok
            $query->where('purok_id', $user->assigned_purok_id);
        }
        // Admin can see all events

        // Filter by upcoming events only by default
        if ($request->get('upcoming', true)) {
            $query->upcoming();
        }

        $events = $query->with('purok')->orderByDate()->get();

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
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'purok_id' => 'nullable|exists:puroks,id',
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

        // Role-based purok assignment
        $purokId = null;
        if ($user->isPurokLeader()) {
            // Purok leaders can only create events for their assigned purok
            $purokId = $user->assigned_purok_id;
        } else {
            // Admin can assign any purok or leave null for barangay-wide events
            $purokId = $request->purok_id;
        }

        $event = Event::create([
            'title' => $request->title,
            'date' => $request->date,
            'location' => $request->location,
            'description' => $request->description,
            'purok_id' => $purokId,
            'created_by' => $user ? $user->id : null,
        ]);

        // Create notifications
        $this->createEventNotifications($event, $user);

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
        $user = $request->user();

        if (!$event) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Event not found',
                'errors' => null,
            ], 404);
        }

        // Role-based access control
        if ($user->isPurokLeader() && $event->purok_id !== $user->assigned_purok_id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You can only edit events from your assigned purok',
                'errors' => null,
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'purok_id' => 'nullable|exists:puroks,id',
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

        // Role-based purok assignment for updates
        $purokId = null;
        if ($user->isPurokLeader()) {
            // Purok leaders can only update events for their assigned purok
            $purokId = $user->assigned_purok_id;
        } else {
            // Admin can assign any purok or leave null for barangay-wide events
            $purokId = $request->purok_id;
        }

        $event->update([
            'title' => $request->title,
            'date' => $request->date,
            'location' => $request->location,
            'description' => $request->description,
            'purok_id' => $purokId,
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
    public function destroy(Request $request, string $id): JsonResponse
    {
        $event = Event::find($id);
        $user = $request->user();

        if (!$event) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Event not found',
                'errors' => null,
            ], 404);
        }

        // Role-based access control
        if ($user->isPurokLeader() && $event->purok_id !== $user->assigned_purok_id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You can only delete events from your assigned purok',
                'errors' => null,
            ], 403);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Event deleted successfully',
            'errors' => null,
        ]);
    }

    /**
     * Create notifications for new event
     */
    private function createEventNotifications($event, $user)
    {
        $eventDate = date('M d, Y', strtotime($event->date));

        if ($event->purok_id) {
            // Purok-level event - notify purok leader
            $purokLeader = User::where('role', 'purok_leader')
                ->where('assigned_purok_id', $event->purok_id)
                ->first();

            if ($purokLeader && $purokLeader->id !== $user->id) {
                NotificationController::createUserNotification(
                    $purokLeader->id,
                    'New Event in Your Purok',
                    "A new event has been scheduled: {$event->title} on {$eventDate} at {$event->location}",
                    'event'
                );
            }
        } else {
            // Barangay-wide event - notify all users
            $allUsers = User::where('id', '!=', $user->id)->get();
            foreach ($allUsers as $targetUser) {
                NotificationController::createUserNotification(
                    $targetUser->id,
                    'New Barangay Event',
                    "A new barangay-wide event has been scheduled: {$event->title} on {$eventDate} at {$event->location}",
                    'event'
                );
            }
        }
    }
}
