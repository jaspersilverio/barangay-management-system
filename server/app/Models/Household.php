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
        'purok_id',
        'household_code',
        'head_name',
        'address',
        'landmark',
        'photo_path',
        'latitude',
        'longitude',
        'created_by',
        'updated_by',
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
     * @return BelongsTo<Purok, Household>
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
     * @return BelongsTo<User, Household>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, Household>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Full location attribute combining address and landmark.
     */
    public function getFullLocationAttribute(): string
    {
        $address = (string) ($this->address ?? '');
        $landmark = (string) ($this->landmark ?? '');
        if ($address !== '' && $landmark !== '') {
            return $address . ' (' . $landmark . ')';
        }
        return $address !== '' ? $address : $landmark;
    }

    /**
     * Scope households within a specific purok.
     */
    public function scopeInPurok($query, int $purokId)
    {
        return $query->where('purok_id', $purokId);
    }

    /**
     * Scope search by household_code, head_name, or address.
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->where('household_code', 'like', $like)
                ->orWhere('head_name', 'like', $like)
                ->orWhere('address', 'like', $like);
        });
    }
}
