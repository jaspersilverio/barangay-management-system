<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;

class CertificateRequest extends Model
{
    protected $fillable = [
        'resident_id',
        'requested_by',
        'approved_by',
        'released_by',
        'certificate_type',
        'purpose',
        'additional_requirements',
        'status',
        'remarks',
        'requested_at',
        'approved_at',
        'released_at',
        'rejected_at'
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'released_at' => 'datetime',
        'rejected_at' => 'datetime'
    ];

    // Relationships
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function issuedCertificate(): HasOne
    {
        return $this->hasOne(IssuedCertificate::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeReleased($query)
    {
        return $query->where('status', 'released');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('certificate_type', $type);
    }

    // Helper methods
    public function getCertificateTypeLabelAttribute(): string
    {
        return match ($this->certificate_type) {
            'barangay_clearance' => 'Barangay Clearance',
            'indigency' => 'Indigency Certificate',
            'residency' => 'Residency Certificate',
            'business_permit_endorsement' => 'Business Permit Endorsement',
            default => ucfirst(str_replace('_', ' ', $this->certificate_type))
        };
    }

    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'warning',
            'approved' => 'success',
            'released' => 'info',
            'rejected' => 'danger',
            default => 'secondary'
        };
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeReleased(): bool
    {
        return $this->status === 'approved';
    }

    public function canBeRejected(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }

    public function approve(User $user, ?string $remarks = null): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'remarks' => $remarks
        ]);

        return true;
    }

    public function release(User $user, ?string $remarks = null): bool
    {
        if (!$this->canBeReleased()) {
            return false;
        }

        $this->update([
            'status' => 'released',
            'released_by' => $user->id,
            'released_at' => now(),
            'remarks' => $remarks
        ]);

        return true;
    }

    public function reject(User $user, string $remarks): bool
    {
        if (!$this->canBeRejected()) {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'rejected_at' => now(),
            'remarks' => $remarks
        ]);

        return true;
    }
}
