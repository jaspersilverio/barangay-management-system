<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Resident extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'household_id',
        'first_name',
        'middle_name',
        'last_name',
        'sex',
        'birthdate',
        'civil_status',
        'relationship_to_head',
        'occupation_status',
        'is_pwd',
        'is_pregnant',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'is_pwd' => 'boolean',
            'is_pregnant' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Household, Resident>
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /**
     * Get blotter cases where this resident is the complainant
     */
    public function complainantBlotters(): HasMany
    {
        return $this->hasMany(Blotter::class, 'complainant_id');
    }

    /**
     * Get blotter cases where this resident is the respondent
     */
    public function respondentBlotters(): HasMany
    {
        return $this->hasMany(Blotter::class, 'respondent_id');
    }

    /**
     * Get vaccinations for this resident
     */
    public function vaccinations(): HasMany
    {
        return $this->hasMany(Vaccination::class);
    }

    /**
     * Compute age from birthdate.
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->birthdate) {
            return null;
        }
        return Carbon::parse($this->birthdate)->age;
    }

    /**
     * Scope seniors (age >= 60).
     */
    public function scopeSeniors($query)
    {
        $cutoff = Carbon::now()->subYears(60)->toDateString();
        return $query->whereDate('birthdate', '<=', $cutoff);
    }

    /**
     * Scope children (age < 18).
     */
    public function scopeChildren($query)
    {
        $cutoff = Carbon::now()->subYears(18)->toDateString();
        return $query->whereDate('birthdate', '>', $cutoff);
    }

    /**
     * Scope PWDs.
     */
    public function scopePwds($query)
    {
        return $query->where('is_pwd', true);
    }

    /**
     * Get the full name of the resident.
     */
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . $this->last_name;
        return $name;
    }

    /**
     * Generic search by name and relationship.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->where('first_name', 'like', $like)
                ->orWhere('middle_name', 'like', $like)
                ->orWhere('last_name', 'like', $like)
                ->orWhere('relationship_to_head', 'like', $like);
        });
    }

    /**
     * Scope for filtering by purok through household relationship.
     */
    public function scopeByPurok($query, $purokId)
    {
        return $query->whereHas('household', function ($q) use ($purokId) {
            $q->where('purok_id', $purokId);
        });
    }

    /**
     * Scope for filtering by age range.
     */
    public function scopeByAgeRange($query, $minAge, $maxAge = null)
    {
        if ($maxAge) {
            return $query->whereDate('birthdate', '<=', now()->subYears($minAge)->toDateString())
                ->whereDate('birthdate', '>', now()->subYears($maxAge)->toDateString());
        }
        return $query->whereDate('birthdate', '<=', now()->subYears($minAge)->toDateString());
    }

    /**
     * Scope for filtering by occupation status.
     */
    public function scopeByOccupation($query, $status)
    {
        return $query->where('occupation_status', $status);
    }

    /**
     * Scope for filtering by gender.
     */
    public function scopeByGender($query, $gender)
    {
        return $query->where('sex', $gender);
    }
}
