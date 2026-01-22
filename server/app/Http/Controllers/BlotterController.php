<?php

namespace App\Http\Controllers;

use App\Http\Requests\Blotter\StoreBlotterRequest;
use App\Http\Requests\Blotter\UpdateBlotterRequest;
use App\Models\Blotter;
use App\Models\Notification;
use App\Models\User;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BlotterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Blotter::withoutTrashed()->with([
                'complainant:id,first_name,last_name,middle_name',
                'respondent:id,first_name,last_name,middle_name',
                'official:id,name',
                'creator:id,name',
                'updater:id,name',
                'approver:id,name',
                'rejector:id,name'
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
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('case_number', 'like', "%{$search}%")
                        ->orWhere('incident_location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        // Search in resident complainant names
                        ->orWhereHas('complainant', function ($subQ) use ($search) {
                            $subQ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        })
                        // Search in resident respondent names
                        ->orWhereHas('respondent', function ($subQ) use ($search) {
                            $subQ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        })
                        // Search in non-resident complainant names
                        ->orWhere('complainant_full_name', 'like', "%{$search}%")
                        // Search in non-resident respondent names
                        ->orWhere('respondent_full_name', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $blotters = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $blotters,
                'message' => 'Blotter cases retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving blotters: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve blotter cases'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBlotterRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            // Generate case number
            $data['case_number'] = Blotter::generateCaseNumber();
            $data['created_by'] = Auth::id();

            // If created by staff, set status to pending for approval
            $user = Auth::user();
            if ($user && $user->isStaff()) {
                $data['status'] = 'pending';
            } else {
                // Admin/purok_leader can set status directly (default to 'Open' if not set)
                $data['status'] = $data['status'] ?? 'Open';
            }

            // Handle resident/non-resident logic
            // For residents, clear non-resident fields
            if ($data['complainant_is_resident']) {
                $data['complainant_full_name'] = null;
                $data['complainant_age'] = null;
                $data['complainant_address'] = null;
                $data['complainant_contact'] = null;
            } else {
                // For non-residents, clear resident ID
                $data['complainant_id'] = null;
            }

            if ($data['respondent_is_resident']) {
                $data['respondent_full_name'] = null;
                $data['respondent_age'] = null;
                $data['respondent_address'] = null;
                $data['respondent_contact'] = null;
            } else {
                // For non-residents, clear resident ID
                $data['respondent_id'] = null;
            }

            // Handle file attachments
            if ($request->hasFile('attachments')) {
                $attachments = [];
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('blotter-attachments', 'public');
                    $attachments[] = [
                        'filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType()
                    ];
                }
                $data['attachments'] = $attachments;
            }

            $blotter = Blotter::create($data);
            $blotter->load([
                'complainant:id,first_name,last_name,middle_name',
                'respondent:id,first_name,last_name,middle_name',
                'official:id,name',
                'creator:id,name'
            ]);

            // If created by staff (pending status), notify captain for approval
            if ($blotter->status === 'pending') {
                NotificationController::notifyCaptainForApproval(
                    'blotter',
                    $blotter->case_number . ' - ' . $blotter->complainant_name . ' vs ' . $blotter->respondent_name,
                    $blotter->id,
                    $blotter->created_by
                );
            } else {
                // Create notification for new blotter case (admin/purok_leader created)
                $this->createBlotterNotification($blotter, 'created');
            }

            Log::info('Blotter case created', ['case_number' => $blotter->case_number, 'id' => $blotter->id]);

            return response()->json([
                'success' => true,
                'data' => $blotter,
                'message' => 'Blotter case created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating blotter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create blotter case'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $blotter = Blotter::with([
                'complainant:id,first_name,last_name,middle_name,contact_number,address',
                'respondent:id,first_name,last_name,middle_name,contact_number,address',
                'official:id,name,email',
                'creator:id,name',
                'updater:id,name'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $blotter,
                'message' => 'Blotter case retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving blotter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Blotter case not found'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBlotterRequest $request, string $id): JsonResponse
    {
        try {
            $blotter = Blotter::findOrFail($id);
            $data = $request->validated();
            $data['updated_by'] = Auth::id();

            // Handle resident/non-resident logic
            if (isset($data['complainant_is_resident'])) {
                if ($data['complainant_is_resident']) {
                    $data['complainant_full_name'] = null;
                    $data['complainant_age'] = null;
                    $data['complainant_address'] = null;
                    $data['complainant_contact'] = null;
                } else {
                    $data['complainant_id'] = null;
                }
            }

            if (isset($data['respondent_is_resident'])) {
                if ($data['respondent_is_resident']) {
                    $data['respondent_full_name'] = null;
                    $data['respondent_age'] = null;
                    $data['respondent_address'] = null;
                    $data['respondent_contact'] = null;
                } else {
                    $data['respondent_id'] = null;
                }
            }

            // Handle new file attachments
            if ($request->hasFile('attachments')) {
                $newAttachments = [];
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('blotter-attachments', 'public');
                    $newAttachments[] = [
                        'filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType()
                    ];
                }

                // Merge with existing attachments
                $existingAttachments = $blotter->attachments ?? [];
                $data['attachments'] = array_merge($existingAttachments, $newAttachments);
            }

            $oldStatus = $blotter->status;
            $oldOfficialId = $blotter->official_id;

            $blotter->update($data);
            $blotter->load([
                'complainant:id,first_name,last_name,middle_name',
                'respondent:id,first_name,last_name,middle_name',
                'official:id,name',
                'creator:id,name',
                'updater:id,name'
            ]);

            // Create notifications for status changes and assignments
            if (isset($data['status']) && $data['status'] !== $oldStatus) {
                $this->createBlotterNotification($blotter, 'status_changed', $oldStatus);
            }

            if (isset($data['official_id']) && $data['official_id'] !== $oldOfficialId) {
                $this->createBlotterNotification($blotter, 'assigned');
            }

            Log::info('Blotter case updated', ['case_number' => $blotter->case_number, 'id' => $blotter->id]);

            return response()->json([
                'success' => true,
                'data' => $blotter,
                'message' => 'Blotter case updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating blotter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update blotter case'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $blotter = Blotter::findOrFail($id);

            // Delete associated files
            if ($blotter->attachments) {
                foreach ($blotter->attachments as $attachment) {
                    if (isset($attachment['path'])) {
                        Storage::disk('public')->delete($attachment['path']);
                    }
                }
            }

            $blotter->delete();

            Log::info('Blotter case deleted', ['case_number' => $blotter->case_number, 'id' => $blotter->id]);

            return response()->json([
                'success' => true,
                'message' => 'Blotter case deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting blotter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete blotter case'
            ], 500);
        }
    }

    /**
     * Get blotter statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total' => Blotter::count(),
                'open' => Blotter::byStatus('Open')->count(),
                'ongoing' => Blotter::byStatus('Ongoing')->count(),
                'resolved' => Blotter::byStatus('Resolved')->count(),
                'this_month' => Blotter::whereMonth('created_at', date('m'))
                    ->whereYear('created_at', date('Y'))
                    ->count(),
                'this_year' => Blotter::whereYear('created_at', date('Y'))->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Blotter statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving blotter statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve blotter statistics'
            ], 500);
        }
    }

    /**
     * Approve a blotter case (captain only)
     */
    public function approve(Request $request, Blotter $blotter): JsonResponse
    {
        // Authorization: Only captain or admin can approve
        $user = Auth::user();
        if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Only Barangay Captain or Admin can approve blotter cases'
            ], 403);
        }

        if (!$blotter->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Blotter case cannot be approved'
            ], 400);
        }

        // Get the captain user (if current user is captain, use them; otherwise find captain user)
        $captainUser = $user->isCaptain() ? $user : User::where('role', 'captain')->first();
        
        if (!$captainUser) {
            return response()->json([
                'success' => false,
                'message' => 'No Barangay Captain found in the system'
            ], 400);
        }

        // Check if captain has a signature uploaded (mandatory for approval)
        if (!$captainUser->signature_path) {
            return response()->json([
                'success' => false,
                'message' => 'Barangay Captain signature is not set. Please upload signature first before approving any requests.'
            ], 400);
        }

        // Approve the blotter
        $blotter->approve($user);
        
        // Move to 'Open' status after approval (becomes official record)
        $blotter->status = 'Open';
        $blotter->save();

        // Reload relationships
        $blotter->load([
            'complainant:id,first_name,last_name,middle_name',
            'respondent:id,first_name,last_name,middle_name',
            'official:id,name',
            'creator:id,name',
            'approver:id,name'
        ]);

        // Notify the creator (staff) that their request was approved
        if ($blotter->created_by) {
            NotificationController::createUserNotification(
                $blotter->created_by,
                'Blotter Case Approved',
                "Your blotter case {$blotter->case_number} has been approved by the Barangay Captain.",
                'blotter_approved'
            );
        }

        // Create system notification
        NotificationController::createSystemNotification(
            'Blotter Case Approved',
            "Blotter case {$blotter->case_number} has been approved and is now an official record.",
            'blotter_approved'
        );

        return response()->json([
            'success' => true,
            'message' => 'Blotter case approved successfully',
            'data' => $blotter
        ]);
    }

    /**
     * Reject a blotter case (captain only)
     */
    public function reject(Request $request, Blotter $blotter): JsonResponse
    {
        // Authorization: Only captain or admin can reject
        $user = Auth::user();
        if (!$user || (!$user->isCaptain() && !$user->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Only Barangay Captain or Admin can reject blotter cases'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'remarks' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$blotter->canBeRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Blotter case cannot be rejected'
            ], 400);
        }

        // Reject the blotter
        $blotter->reject($user, $request->remarks);
        
        // Reload relationships
        $blotter->load([
            'complainant:id,first_name,last_name,middle_name',
            'respondent:id,first_name,last_name,middle_name',
            'official:id,name',
            'creator:id,name',
            'rejector:id,name'
        ]);

        // Notify the creator (staff) that their request was rejected
        if ($blotter->created_by) {
            NotificationController::createUserNotification(
                $blotter->created_by,
                'Blotter Case Rejected',
                "Your blotter case {$blotter->case_number} has been rejected. Reason: {$request->remarks}",
                'blotter_rejected'
            );
        }

        // Create system notification
        NotificationController::createSystemNotification(
            'Blotter Case Rejected',
            "Blotter case {$blotter->case_number} has been rejected. Reason: {$request->remarks}",
            'blotter_rejected'
        );

        return response()->json([
            'success' => true,
            'message' => 'Blotter case rejected successfully',
            'data' => $blotter
        ]);
    }

    /**
     * Create notification for blotter events
     */
    private function createBlotterNotification(Blotter $blotter, string $event, $oldValue = null): void
    {
        try {
            $complainantName = $blotter->complainant_name;
            $respondentName = $blotter->respondent_name;

            switch ($event) {
                case 'created':
                    $title = 'New Blotter Case Created';
                    $message = "New blotter case {$blotter->case_number} has been created. Complainant: {$complainantName}, Respondent: {$respondentName}";
                    break;

                case 'status_changed':
                    $title = 'Blotter Case Status Updated';
                    $message = "Blotter case {$blotter->case_number} status changed from {$oldValue} to {$blotter->status}";
                    break;

                case 'assigned':
                    $officialName = $blotter->official ? $blotter->official->name : 'Unassigned';
                    $title = 'Blotter Case Assigned';
                    $message = "Blotter case {$blotter->case_number} has been assigned to {$officialName}";
                    break;

                case 'restored':
                    $title = 'Blotter Case Restored';
                    $message = "Blotter case {$blotter->case_number} has been restored from archive";
                    break;

                default:
                    return;
            }

            // Create system-wide notification
            Notification::create([
                'title' => $title,
                'message' => $message,
                'type' => 'blotter',
                'user_id' => null // System-wide notification
            ]);

            // If there's an assigned official, also notify them specifically
            if ($blotter->official_id && $event !== 'assigned') {
                Notification::create([
                    'title' => $title,
                    'message' => $message,
                    'type' => 'blotter',
                    'user_id' => $blotter->official_id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error creating blotter notification: ' . $e->getMessage());
        }
    }
}
