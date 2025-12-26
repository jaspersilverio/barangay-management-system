<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FourPsBeneficiary extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'household_id',
        'four_ps_number',
        'status',
        'date_registered',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_registered' => 'date',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Household>
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /**
     * @return BelongsTo<User>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope search by four_ps_number, household head_name, or address.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->where('four_ps_number', 'like', $like)
                ->orWhereHas('household', function ($householdQuery) use ($like) {
                    $householdQuery->where('head_name', 'like', $like)
                        ->orWhere('address', 'like', $like);
                });
        });
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by purok.
     */
    public function scopeByPurok($query, $purokId)
    {
        return $query->whereHas('household', function ($q) use ($purokId) {
            $q->where('purok_id', $purokId);
        });
    }
}

