<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Blotter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'case_number',
        'complainant_id',
        'complainant_is_resident',
        'complainant_full_name',
        'complainant_age',
        'complainant_address',
        'complainant_contact',
        'respondent_id',
        'respondent_is_resident',
        'respondent_full_name',
        'respondent_age',
        'respondent_address',
        'respondent_contact',
        'official_id',
        'incident_date',
        'incident_time',
        'incident_location',
        'description',
        'status',
        'resolution',
        'attachments',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'incident_time' => 'string', // TIME column stores as HH:MM:SS string
        'attachments' => 'array',
        'complainant_is_resident' => 'boolean',
        'respondent_is_resident' => 'boolean',
        'complainant_age' => 'integer',
        'respondent_age' => 'integer',
    ];

    /**
     * Get the complainant (resident who filed the complaint)
     */
    public function complainant(): BelongsTo
    {
        return $this->belongsTo(Resident::class, 'complainant_id');
    }

    /**
     * Get the respondent (resident being complained against)
     */
    public function respondent(): BelongsTo
    {
        return $this->belongsTo(Resident::class, 'respondent_id');
    }

    /**
     * Get the assigned official
     */
    public function official(): BelongsTo
    {
        return $this->belongsTo(User::class, 'official_id');
    }

    /**
     * Get the user who created this blotter
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this blotter
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Generate case number automatically
     */
    public static function generateCaseNumber(): string
    {
        $year = date('Y');
        $lastCase = static::where('case_number', 'like', "BLOTTER-{$year}-%")
            ->orderBy('case_number', 'desc')
            ->first();

        if ($lastCase) {
            $lastNumber = (int) substr($lastCase->case_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "BLOTTER-{$year}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
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
     * Get complainant name (resident or non-resident)
     */
    public function getComplainantNameAttribute(): string
    {
        if ($this->complainant_is_resident && $this->complainant) {
            return $this->complainant->full_name;
        }

        return $this->complainant_full_name ?? 'Unknown';
    }

    /**
     * Get respondent name (resident or non-resident)
     */
    public function getRespondentNameAttribute(): string
    {
        if ($this->respondent_is_resident && $this->respondent) {
            return $this->respondent->full_name;
        }

        return $this->respondent_full_name ?? 'Unknown';
    }

    /**
     * Get complainant type (Resident or Non-Resident)
     */
    public function getComplainantTypeAttribute(): string
    {
        return $this->complainant_is_resident ? 'Resident' : 'Non-Resident';
    }

    /**
     * Get respondent type (Resident or Non-Resident)
     */
    public function getRespondentTypeAttribute(): string
    {
        return $this->respondent_is_resident ? 'Resident' : 'Non-Resident';
    }
}
