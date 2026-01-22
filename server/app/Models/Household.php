<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Household extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'address',
        'property_type',
        'head_name', // Keep for backward compatibility during migration
        'head_resident_id', // New: Reference to resident who is the head
        'contact',
        'purok_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Purok>
     */
    public function purok(): BelongsTo
    {
        return $this->belongsTo(Purok::class);
    }

    /**
     * @return BelongsTo<Resident>
     */
    public function headResident(): BelongsTo
    {
        return $this->belongsTo(Resident::class, 'head_resident_id');
    }

    /**
     * @return HasMany<Resident>
     */
    public function residents(): HasMany
    {
        return $this->hasMany(Resident::class);
    }

    /**
     * @return HasMany<FourPsBeneficiary>
     */
    public function fourPsBeneficiaries(): HasMany
    {
        return $this->hasMany(FourPsBeneficiary::class);
    }

    /**
     * Scope search by address, head_name, head resident name, or contact.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->where('address', 'like', $like)
                ->orWhere('head_name', 'like', $like)
                ->orWhere('contact', 'like', $like)
                ->orWhereHas('headResident', function ($residentQuery) use ($like) {
                    $residentQuery->where('first_name', 'like', $like)
                        ->orWhere('middle_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like);
                });
        });
    }

    /**
     * Scope for filtering by purok.
     */
    public function scopeByPurok($query, $purokId)
    {
        return $query->where('purok_id', $purokId);
    }

    /**
     * Scope for filtering by property type.
     */
    public function scopeByPropertyType($query, $type)
    {
        return $query->where('property_type', $type);
    }

    /**
     * Scope for households with residents count.
     */
    public function scopeWithResidentsCount($query)
    {
        return $query->withCount('residents');
    }

    /**
     * Scope for households with active residents only.
     */
    public function scopeWithActiveResidents($query)
    {
        return $query->withCount(['residents' => function ($q) {
            $q->whereNull('deleted_at');
        }]);
    }
}
