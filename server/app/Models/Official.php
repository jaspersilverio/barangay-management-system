<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

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
     * Get the photo URL for web display.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo_path) {
            // Check if file exists before returning URL
            if (Storage::disk('public')->exists($this->photo_path)) {
                // Get base URL from config
                $baseUrl = config('app.url', 'http://localhost:8000');
                $baseUrl = rtrim($baseUrl, '/');

                // Use API route to serve images with CORS headers
                // This avoids ORB (Opaque Response Blocking) issues
                // Add cache-busting query parameter using updated_at timestamp
                $cacheBuster = $this->updated_at ? '?t=' . $this->updated_at->timestamp : '';
                $url = $baseUrl . '/api/storage/' . $this->photo_path . $cacheBuster;

                return $url;
            }
            // If file doesn't exist, return null to trigger default placeholder
            return null;
        }
        return null;
    }

    /**
     * Get the absolute file path for PDF generation.
     * Returns the full filesystem path to the image file.
     * Note: This method is named differently to avoid conflict with the photo_path column.
     */
    public function getPhotoAbsolutePath(): ?string
    {
        if ($this->photo_path) {
            $fullPath = Storage::disk('public')->path($this->photo_path);
            // Check if file exists
            if (file_exists($fullPath)) {
                return $fullPath;
            }
        }
        return null;
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
