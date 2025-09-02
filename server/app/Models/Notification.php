<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope a query to only include read notifications.
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope a query to only include notifications for a specific user or system-wide.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
                ->orWhereNull('user_id'); // System-wide notifications
        });
    }

    /**
     * Get the icon for the notification type.
     */
    public function getIconAttribute(): string
    {
        return match ($this->type) {
            'event' => '📅',
            'household' => '🏠',
            'resident' => '🧑',
            'system' => '⚙️',
            'certificate_request' => '📋',
            'certificate_approved' => '✅',
            'certificate_rejected' => '❌',
            'certificate_released' => '📄',
            'certificate_issued' => '📜',
            'certificate_invalidated' => '🚫',
            default => 'ℹ️'
        };
    }
}
