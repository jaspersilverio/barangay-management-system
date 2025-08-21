<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purok extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'description',
        'centroid_lat',
        'centroid_lng',
        'boundary_geojson',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'centroid_lat' => 'float',
            'centroid_lng' => 'float',
            'boundary_geojson' => 'array',
        ];
    }

    /**
     * @return HasMany<Household>
     */
    public function households(): HasMany
    {
        return $this->hasMany(Household::class);
    }

    /**
     * @return HasMany<Landmark>
     */
    public function landmarks(): HasMany
    {
        return $this->hasMany(Landmark::class);
    }
}
