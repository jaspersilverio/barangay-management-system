<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

class SoloParent extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'resident_id',
        'eligibility_reason',
        'date_declared',
        'valid_until',
        'verification_date',
        'verified_by',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_declared' => 'date',
            'valid_until' => 'date',
            'verification_date' => 'date',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Resident>
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    /**
     * @return BelongsTo<User>
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * @return BelongsTo<User>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Compute current status based on rules:
     * - Active: Current date <= valid_until AND resident still meets conditions
     * - Expired: Current date > valid_until
     * - Inactive: Resident married OR no eligible dependent children
     */
    public function getComputedStatusAttribute(): string
    {
        $now = Carbon::now();
        
        // Check if expired (valid_until must exist and be in the past)
        if ($this->valid_until && $now->gt($this->valid_until)) {
            return 'expired';
        }

        // Check if resident is married (inactive)
        if ($this->resident && $this->resident->civil_status === 'married') {
            return 'inactive';
        }

        // Check if has eligible dependent children (under 18)
        $hasDependentChildren = $this->hasEligibleDependentChildren();
        if (!$hasDependentChildren) {
            return 'inactive';
        }

        return 'active';
    }

    /**
     * Check if resident has eligible dependent children (under 18)
     */
    public function hasEligibleDependentChildren(): bool
    {
        if (!$this->resident || !$this->resident->household) {
            return false;
        }

        $household = $this->resident->household;
        $cutoffDate = Carbon::now()->subYears(18)->toDateString();

        // Get children in the same household
        $children = \App\Models\Resident::where('household_id', $household->id)
            ->where('id', '!=', $this->resident_id)
            ->whereIn('relationship_to_head', ['son', 'daughter', 'child'])
            ->whereDate('birthdate', '>', $cutoffDate)
            ->count();

        return $children > 0;
    }

    /**
     * Get dependent children (under 18)
     * @return Collection
     */
    public function getDependentChildren()
    {
        if (!$this->resident || !$this->resident->household) {
            return collect([]);
        }

        $household = $this->resident->household;
        $cutoffDate = Carbon::now()->subYears(18)->toDateString();

        return \App\Models\Resident::where('household_id', $household->id)
            ->where('id', '!=', $this->resident_id)
            ->whereIn('relationship_to_head', ['son', 'daughter', 'child'])
            ->whereDate('birthdate', '>', $cutoffDate)
            ->get();
    }

    /**
     * Scope search by resident name or eligibility reason.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->whereHas('resident', function ($residentQuery) use ($like) {
                $residentQuery->where('first_name', 'like', $like)
                    ->orWhere('middle_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like);
            });
        });
    }

    /**
     * Scope for filtering by computed status.
     */
    public function scopeByComputedStatus($query, string $status)
    {
        $now = Carbon::now()->toDateString();
        
        if ($status === 'active') {
            return $query->whereDate('valid_until', '>=', $now)
                ->whereHas('resident', function ($q) {
                    $q->where('civil_status', '!=', 'married');
                });
        } elseif ($status === 'expired') {
            return $query->whereDate('valid_until', '<', $now);
        } elseif ($status === 'inactive') {
            return $query->where(function ($q) use ($now) {
                $q->whereDate('valid_until', '>=', $now)
                    ->whereHas('resident', function ($residentQuery) {
                        $residentQuery->where('civil_status', '=', 'married');
                    });
            });
        }
        
        return $query;
    }

    /**
     * Scope for filtering by purok.
     */
    public function scopeByPurok($query, $purokId)
    {
        return $query->whereHas('resident.household', function ($q) use ($purokId) {
            $q->where('purok_id', $purokId);
        });
    }

    /**
     * Get eligibility reason label.
     */
    public function getEligibilityReasonLabelAttribute(): string
    {
        return match($this->eligibility_reason) {
            'death_of_spouse' => 'Death of Spouse',
            'abandonment' => 'Abandonment',
            'legally_separated' => 'Legally Separated',
            'unmarried_parent' => 'Unmarried Parent',
            'spouse_incapacitated' => 'Spouse Incapacitated',
            default => ucfirst(str_replace('_', ' ', $this->eligibility_reason)),
        };
    }
}

