<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
        'suffix',
        'sex',
        'birthdate',
        'place_of_birth',
        'nationality',
        'religion',
        'contact_number',
        'email',
        'valid_id_type',
        'valid_id_number',
        'civil_status',
        'relationship_to_head',
        'occupation_status',
        'employer_workplace',
        'educational_attainment',
        'is_pwd',
        'is_pregnant',
        'resident_status',
        'remarks',
        'photo_path',
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
     * Get solo parent record for this resident
     * @return HasOne<SoloParent>
     */
    public function soloParent(): HasOne
    {
        return $this->hasOne(SoloParent::class);
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
        if ($this->suffix) {
            $name .= ' ' . $this->suffix;
        }
        return $name;
    }

    /**
     * Generic search by name, purok, household/head name, and occupation.
     * Ensures heads of household are searchable even if they don't have household relationship.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            // Search by full name (first, middle, last, suffix) - this will find all residents including heads
            $q->where('first_name', 'like', $like)
                ->orWhere('middle_name', 'like', $like)
                ->orWhere('last_name', 'like', $like)
                ->orWhere('suffix', 'like', $like)
                // Search by relationship
                ->orWhere('relationship_to_head', 'like', $like)
                // Search by occupation
                ->orWhere('occupation_status', 'like', $like)
                // Search by purok through household relationship (only for residents with household)
                ->orWhereHas('household.purok', function ($purokQuery) use ($like) {
                    $purokQuery->where('name', 'like', $like);
                })
                // Search by household head name (for members searching by their head's name)
                ->orWhereHas('household.headResident', function ($headQuery) use ($like) {
                    $headQuery->where(function ($nameQuery) use ($like) {
                        $nameQuery->where('first_name', 'like', $like)
                            ->orWhere('middle_name', 'like', $like)
                            ->orWhere('last_name', 'like', $like)
                            ->orWhere('suffix', 'like', $like);
                    });
                })
                // Search by household address (as fallback)
                ->orWhereHas('household', function ($householdQuery) use ($like) {
                    $householdQuery->where('address', 'like', $like);
                })
                // Search for heads of household by checking if this resident is a head (for searching heads directly)
                ->orWhereIn('id', function ($subQuery) use ($like) {
                    $subQuery->select('head_resident_id')
                        ->from('households')
                        ->where('address', 'like', $like)
                        ->whereNotNull('head_resident_id');
                })
                // Search heads by purok name through their household
                ->orWhereIn('id', function ($subQuery) use ($like) {
                    $subQuery->select('households.head_resident_id')
                        ->from('households')
                        ->join('puroks', 'households.purok_id', '=', 'puroks.id')
                        ->where('puroks.name', 'like', $like)
                        ->whereNotNull('households.head_resident_id');
                });
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

    /**
     * Check if resident is a senior citizen (age >= 60).
     */
    public function getIsSeniorAttribute(): bool
    {
        return $this->age !== null && $this->age >= 60;
    }

    /**
     * Check if resident is a solo parent.
     * Solo parent: Head of household, single/widowed/divorced/separated, with dependents
     */
    public function getIsSoloParentAttribute(): bool
    {
        try {
            if (!$this->household || !$this->household_id) {
                return false;
            }

            // Check if this resident is the head of household
            $isHead = $this->household->head_resident_id === $this->id;

            if (!$isHead) {
                return false;
            }

            // Check civil status
            $soloStatuses = ['single', 'widowed', 'divorced', 'separated'];
            if (!in_array($this->civil_status, $soloStatuses)) {
                return false;
            }

            // Check if household has other residents (dependents)
            // Use direct query to avoid N+1 issues
            $hasDependents = Resident::where('household_id', $this->household_id)
                ->where('id', '!=', $this->id)
                ->exists();

            return $hasDependents;
        } catch (\Exception $e) {
            // If any error occurs, return false
            return false;
        }
    }

    /**
     * Get all classifications for this resident.
     */
    public function getClassificationsAttribute(): array
    {
        $classifications = [];

        if ($this->is_senior) {
            $classifications[] = 'Senior Citizen';
        }

        if ($this->is_pwd) {
            $classifications[] = 'PWD';
        }

        if ($this->is_solo_parent) {
            $classifications[] = 'Solo Parent';
        }

        return $classifications;
    }

    /**
     * Get households where this resident is the head.
     */
    public function headOfHouseholds(): HasMany
    {
        return $this->hasMany(Household::class, 'head_resident_id');
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
}
