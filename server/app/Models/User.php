<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
        'signature_path',
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

    public function isCaptain(): bool
    {
        return $this->role === 'captain';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
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

    /**
     * Get the signature URL for web display.
     */
    public function getSignatureUrlAttribute(): ?string
    {
        if ($this->signature_path) {
            // Check if file exists before returning URL
            if (Storage::disk('public')->exists($this->signature_path)) {
                // Get base URL from config
                $baseUrl = config('app.url', 'http://localhost:8000');
                $baseUrl = rtrim($baseUrl, '/');

                // Use API route to serve images with CORS headers
                // Add cache-busting query parameter using updated_at timestamp
                $cacheBuster = $this->updated_at ? '?t=' . $this->updated_at->timestamp : '';
                $url = $baseUrl . '/api/storage/' . $this->signature_path . $cacheBuster;

                return $url;
            }
            // If file doesn't exist, return null
            return null;
        }
        return null;
    }

    /**
     * Get the absolute file path for PDF generation.
     * Returns the full filesystem path to the signature image file.
     */
    public function getSignatureAbsolutePath(): ?string
    {
        if ($this->signature_path) {
            $fullPath = Storage::disk('public')->path($this->signature_path);
            // Check if file exists
            if (file_exists($fullPath)) {
                return $fullPath;
            }
        }
        return null;
    }
}
