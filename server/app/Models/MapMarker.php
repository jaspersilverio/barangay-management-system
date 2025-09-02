<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MapMarker extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'x_position',
        'y_position',
        'created_by',
        'household_id',
    ];

    protected $casts = [
        'x_position' => 'float',
        'y_position' => 'float',
    ];

    /**
     * Get the user who created this marker.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the household associated with this marker.
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /**
     * Get marker type options.
     */
    public static function getTypeOptions(): array
    {
        return [
            'household' => 'Household',
            'barangay_hall' => 'Barangay Hall',
            'chapel' => 'Chapel',
            'church' => 'Church',
            'school' => 'School',
            'health_center' => 'Health Center',
            'evacuation_center' => 'Evacuation Center',
            'poi' => 'Point of Interest',
            'purok_boundary' => 'Purok Boundary',
            'settlement_zone' => 'Settlement Zone',
            'hazard_zone' => 'Hazard Zone',
            'primary_road' => 'Primary Road',
            'waterway' => 'Waterway',
        ];
    }

    /**
     * Get marker icon based on type.
     */
    public function getIconAttribute(): string
    {
        return match ($this->type) {
            'household' => '🏠',
            'barangay_hall' => '🏛️',
            'chapel' => '⛪',
            'church' => '✝️',
            'school' => '🏫',
            'health_center' => '🏥',
            'evacuation_center' => '🚨',
            'poi' => '📍',
            'purok_boundary' => '🗺️',
            'settlement_zone' => '🏘️',
            'hazard_zone' => '⚠️',
            'primary_road' => '🛣️',
            'waterway' => '🌊',
            default => '📍',
        };
    }

    /**
     * Get marker color based on type.
     */
    public function getColorAttribute(): string
    {
        return match ($this->type) {
            'household' => 'bg-blue-500',
            'barangay_hall' => 'bg-red-500',
            'chapel' => 'bg-yellow-500',
            'church' => 'bg-yellow-600',
            'school' => 'bg-green-500',
            'health_center' => 'bg-purple-500',
            'evacuation_center' => 'bg-red-600',
            'poi' => 'bg-indigo-500',
            'purok_boundary' => 'bg-emerald-600',
            'settlement_zone' => 'bg-violet-600',
            'hazard_zone' => 'bg-orange-600',
            'primary_road' => 'bg-gray-700',
            'waterway' => 'bg-sky-500',
            default => 'bg-gray-400',
        };
    }
}
