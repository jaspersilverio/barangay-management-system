<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'relationship_to_head',
        'occupation_status',
        'is_pwd',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'is_pwd' => 'boolean',
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
}
