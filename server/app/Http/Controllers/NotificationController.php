<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::forUser(Auth::id())
            ->orderBy('created_at', 'desc');

        // Filter by read status
        if ($request->has('filter')) {
            switch ($request->filter) {
                case 'unread':
                    $query->unread();
                    break;
                case 'read':
                    $query->read();
                    break;
            }
        }

        // Paginate results
        $perPage = $request->get('per_page', 15);
        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    /**
     * Get unread count and latest notifications for the bell.
     */
    public function bell(): JsonResponse
    {
        $unreadCount = Notification::forUser(Auth::id())->unread()->count();
        $latestNotifications = Notification::forUser(Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $unreadCount,
                'notifications' => $latestNotifications
            ]
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead($id): JsonResponse
    {
        $notification = Notification::forUser(Auth::id())
            ->findOrFail($id);

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): JsonResponse
    {
        Notification::forUser(Auth::id())
            ->unread()
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Create a notification (for internal use).
     */
    public static function createNotification($data): Notification
    {
        return Notification::create($data);
    }

    /**
     * Create a system-wide notification.
     */
    public static function createSystemNotification($title, $message, $type = 'info'): Notification
    {
        return self::createNotification([
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'user_id' => null // System-wide
        ]);
    }

    /**
     * Create a user-specific notification.
     */
    public static function createUserNotification($userId, $title, $message, $type = 'info'): Notification
    {
        return self::createNotification([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type
        ]);
    }

    /**
     * Create a notification for the Barangay Captain
     */
    public static function createCaptainNotification($title, $message, $type = 'approval_required'): ?Notification
    {
        $captain = User::where('role', 'captain')->first();
        
        if (!$captain) {
            return null;
        }

        return self::createUserNotification($captain->id, $title, $message, $type);
    }

    /**
     * Create notification for captain when a new request needs approval
     */
    public static function notifyCaptainForApproval($requestType, $requestTitle, $requestId, $createdBy = null): ?Notification
    {
        $captain = User::where('role', 'captain')->first();
        
        if (!$captain) {
            return null;
        }

        $creatorName = $createdBy ? User::find($createdBy)?->name : 'Staff';
        $type = match ($requestType) {
            'certificate' => 'certificate_request',
            'blotter' => 'blotter_pending',
            'incident' => 'incident_pending',
            default => 'approval_required'
        };

        $title = match ($requestType) {
            'certificate' => 'Certificate Request Requires Approval',
            'blotter' => 'Blotter Case Requires Approval',
            'incident' => 'Incident Report Requires Approval',
            default => 'Request Requires Approval'
        };

        $message = match ($requestType) {
            'certificate' => "New certificate request from {$creatorName}: {$requestTitle}. Request ID: #{$requestId}",
            'blotter' => "New blotter case from {$creatorName}: {$requestTitle}. Case #{$requestId}",
            'incident' => "New incident report from {$creatorName}: {$requestTitle}. Report ID: #{$requestId}",
            default => "New request from {$creatorName}: {$requestTitle}. Request ID: #{$requestId}"
        };

        return self::createUserNotification($captain->id, $title, $message, $type);
    }
}
