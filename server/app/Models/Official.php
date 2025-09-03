<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Official extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'position',
        'term_start',
        'term_end',
        'contact',
        'photo_path',
        'active',
    ];

    protected $casts = [
        'term_start' => 'date',
        'term_end' => 'date',
        'active' => 'boolean',
    ];

    /**
     * Get the user associated with this official.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get only active officials.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Get the photo URL.
     */
    public function getPhotoUrlAttribute(): string
    {
        if ($this->photo_path) {
            // Use hardcoded URL for now to fix image display
            return 'http://localhost:8000/storage/' . $this->photo_path;
        }
        // Return a data URI for a simple default avatar
        return 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#e5e7eb"/><circle cx="60" cy="45" r="20" fill="#9ca3af"/><path d="M20 100c0-22 18-40 40-40s40 18 40 40" fill="#9ca3af"/></svg>');
    }

    /**
     * Get the term period as a formatted string.
     */
    public function getTermPeriodAttribute(): string
    {
        if (!$this->term_start && !$this->term_end) {
            return 'No term specified';
        }

        $start = $this->term_start ? $this->term_start->format('M Y') : 'N/A';
        $end = $this->term_end ? $this->term_end->format('M Y') : 'Present';

        return "{$start} - {$end}";
    }

    /**
     * Check if the official is currently in term.
     */
    public function getIsInTermAttribute(): bool
    {
        $now = now();

        if ($this->term_start && $now->lt($this->term_start)) {
            return false;
        }

        if ($this->term_end && $now->gt($this->term_end)) {
            return false;
        }

        return true;
    }
}
