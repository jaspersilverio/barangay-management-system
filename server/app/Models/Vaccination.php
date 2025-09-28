<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vaccination extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'resident_id',
        'vaccine_name',
        'dose_number',
        'date_administered',
        'next_due_date',
        'status',
        'administered_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_administered' => 'date',
            'next_due_date' => 'date',
            'status' => 'string',
        ];
    }

    /**
     * Get the resident that owns the vaccination.
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by vaccine name
     */
    public function scopeByVaccine($query, $vaccineName)
    {
        return $query->where('vaccine_name', 'like', '%' . $vaccineName . '%');
    }

    /**
     * Scope for filtering by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date_administered', [$startDate, $endDate]);
    }

    /**
     * Scope for filtering by resident's purok
     */
    public function scopeByPurok($query, $purokId)
    {
        return $query->whereHas('resident.household', function ($q) use ($purokId) {
            $q->where('purok_id', $purokId);
        });
    }

    /**
     * Scope for filtering by age group
     */
    public function scopeByAgeGroup($query, $minAge, $maxAge = null)
    {
        return $query->whereHas('resident', function ($q) use ($minAge, $maxAge) {
            if ($maxAge) {
                $q->whereRaw('TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN ? AND ?', [$minAge, $maxAge]);
            } else {
                $q->whereRaw('TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) >= ?', [$minAge]);
            }
        });
    }
}
