<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'assigned_purok_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'string',
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Purok, User>
     */
    public function assignedPurok()
    {
        return $this->belongsTo(Purok::class, 'assigned_purok_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPurokLeader(): bool
    {
        return $this->role === 'purok_leader';
    }

    /**
     * Get blotter cases assigned to this official
     */
    public function assignedBlotters(): HasMany
    {
        return $this->hasMany(Blotter::class, 'official_id');
    }

    /**
     * Get blotter cases created by this user
     */
    public function createdBlotters(): HasMany
    {
        return $this->hasMany(Blotter::class, 'created_by');
    }

    /**
     * Get blotter cases updated by this user
     */
    public function updatedBlotters(): HasMany
    {
        return $this->hasMany(Blotter::class, 'updated_by');
    }
}
