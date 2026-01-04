<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class IncidentReport extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'incident_title',
        'description',
        'incident_date',
        'incident_time',
        'location',
        'persons_involved',
        'reporting_officer_id',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'incident_time' => 'string', // TIME column stores as HH:MM:SS string
        'persons_involved' => 'array', // JSON field for persons involved
    ];

    /**
     * Get the reporting officer (barangay staff)
     */
    public function reportingOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporting_officer_id');
    }

    /**
     * Get the user who created this incident report
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this incident report
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for filtering by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('incident_date', [$startDate, $endDate]);
    }

    /**
     * Scope for searching
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('incident_title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%");
        });
    }
}
