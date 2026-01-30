<?php

namespace App\Models;

use Carbon\Carbon;
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
        'vaccination_type',
        'required_doses',
        'completed_doses',
        'schedule_date',
        'completed_at',
        'next_due_date',
        'vaccine_name',
        'dose_number',
        'date_administered',
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
            'schedule_date' => 'date',
            'date_administered' => 'date',
            'next_due_date' => 'date',
            'completed_at' => 'date',
            'status' => 'string',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['computed_status', 'can_complete'];

    /**
     * Compute status dynamically (DO NOT STORE).
     * 1. completed: completed_at set AND (fixed_dose: completed_doses >= required_doses; else: one dose done).
     * 2. scheduled: schedule_date is in the future.
     * 3. pending: schedule_date is today.
     * 4. overdue: schedule_date is before today.
     */
    public function getComputedStatusAttribute(): string
    {
        $today = Carbon::today()->startOfDay();
        $isFixedDose = $this->vaccination_type === 'fixed_dose';
        $required = (int) ($this->required_doses ?? 0);
        $completed = (int) ($this->completed_doses ?? 0);

        // 1. Completed: completed_at set and (fixed_dose: completed_doses >= required_doses; else any dose done)
        if ($this->completed_at !== null) {
            if ($isFixedDose && $required > 0) {
                if ($completed >= $required) {
                    return 'completed';
                }
            } else {
                return 'completed';
            }
        }

        // 2. Scheduled / 3. Pending / 4. Overdue: use schedule_date vs today
        $scheduleDate = $this->schedule_date;
        if ($scheduleDate === null) {
            return 'pending';
        }

        $scheduled = Carbon::parse($scheduleDate)->startOfDay();
        if ($scheduled->isAfter($today)) {
            return 'scheduled';
        }
        if ($scheduled->isSameDay($today)) {
            return 'pending';
        }

        return 'overdue';
    }

    /**
     * Whether the user can mark a dose as complete (pending or overdue).
     */
    public function getCanCompleteAttribute(): bool
    {
        $status = $this->computed_status;
        return $status === 'pending' || $status === 'overdue';
    }

    /**
     * Scope: filter by computed status (completed, scheduled, pending, overdue).
     */
    public function scopeComputedStatus($query, string $status)
    {
        $today = Carbon::today()->toDateString();
        $status = strtolower($status);

        return match ($status) {
            'completed' => $query->whereNotNull('completed_at'),
            'scheduled' => $query->whereNotNull('schedule_date')->whereDate('schedule_date', '>', $today),
            'pending' => $query->whereNotNull('schedule_date')->whereDate('schedule_date', $today)->whereNull('completed_at'),
            'overdue' => $query->whereNotNull('schedule_date')->whereDate('schedule_date', '<', $today)->whereNull('completed_at'),
            default => $query,
        };
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
     * Scope for filtering by date range (schedule_date or date_administered)
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('schedule_date', [$startDate, $endDate])
                ->orWhereBetween('date_administered', [$startDate, $endDate]);
        });
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
