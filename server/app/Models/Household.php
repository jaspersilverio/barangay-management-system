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
        'head_name',
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
     * @return HasMany<Resident>
     */
    public function residents(): HasMany
    {
        return $this->hasMany(Resident::class);
    }

    /**
     * Scope search by address, head_name, or contact.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->where('address', 'like', $like)
                ->orWhere('head_name', 'like', $like)
                ->orWhere('contact', 'like', $like);
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
