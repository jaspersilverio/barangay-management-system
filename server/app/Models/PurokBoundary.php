<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurokBoundary extends Model
{
    protected $fillable = [
        'purok_id',
        'points',
        'centroid_x',
        'centroid_y',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'points' => 'array',
        'centroid_x' => 'decimal:4',
        'centroid_y' => 'decimal:4'
    ];

    /**
     * Get the purok that owns the boundary.
     */
    public function purok(): BelongsTo
    {
        return $this->belongsTo(Purok::class);
    }

    /**
     * Get the user who created the boundary.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the boundary.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Calculate and set the centroid of the boundary.
     */
    public function calculateCentroid(): void
    {
        if (empty($this->points)) {
            return;
        }

        $sumX = 0;
        $sumY = 0;
        $count = count($this->points);

        foreach ($this->points as $point) {
            $sumX += $point['x'];
            $sumY += $point['y'];
        }

        $this->centroid_x = $sumX / $count;
        $this->centroid_y = $sumY / $count;
    }
}
