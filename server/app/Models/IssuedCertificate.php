<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class IssuedCertificate extends Model
{
    protected $fillable = [
        'certificate_request_id',
        'resident_id',
        'issued_by',
        'certificate_type',
        'certificate_number',
        'purpose',
        'pdf_path',
        'qr_code',
        'valid_from',
        'valid_until',
        'is_valid',
        'signed_by',
        'signature_position',
        'signed_at'
    ];

    protected $casts = [
        'valid_from' => 'date',
        'valid_until' => 'date',
        'is_valid' => 'boolean',
        'signed_at' => 'datetime'
    ];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

    // Relationships
    public function certificateRequest(): BelongsTo
    {
        return $this->belongsTo(CertificateRequest::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    // Scopes
    public function scopeValid($query)
    {
        return $query->where('is_valid', true)
            ->where('valid_until', '>=', now());
    }

    public function scopeExpired($query)
    {
        return $query->where(function ($q) {
            $q->where('is_valid', false)
                ->orWhere('valid_until', '<', now());
        });
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

    public function getStatusAttribute(): string
    {
        if (!$this->is_valid) {
            return 'invalid';
        }

        if ($this->valid_until < now()) {
            return 'expired';
        }

        return 'valid';
    }

    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            'valid' => 'success',
            'expired' => 'warning',
            'invalid' => 'danger',
            default => 'secondary'
        };
    }

    public function isExpired(): bool
    {
        return $this->valid_until < now();
    }

    public function isValid(): bool
    {
        return $this->is_valid && !$this->isExpired();
    }

    public function getDaysUntilExpiryAttribute(): int
    {
        return now()->diffInDays($this->valid_until, false);
    }

    public function generateCertificateNumber(): string
    {
        $year = now()->format('Y');
        $type = strtoupper(substr($this->certificate_type, 0, 3));
        $sequence = static::whereYear('created_at', $year)
            ->where('certificate_type', $this->certificate_type)
            ->count() + 1;

        return sprintf('%s-%s-%04d', $year, $type, $sequence);
    }

    public function generateQrCode(): string
    {
        // Load resident if not already loaded
        if (!$this->relationLoaded('resident')) {
            $this->load('resident');
        }
        
        $data = [
            'certificate_number' => $this->certificate_number,
            'resident_name' => $this->resident?->full_name ?? 'Unknown',
            'certificate_type' => $this->certificate_type,
            'valid_until' => $this->valid_until ? $this->valid_until->format('Y-m-d') : null,
            'issued_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s')
        ];

        return base64_encode(json_encode($data));
    }

    public function getPdfUrlAttribute(): ?string
    {
        if (!$this->pdf_path) {
            return null;
        }

        return config('app.url') . '/storage/' . $this->pdf_path;
    }

    public function sign(string $signedBy, string $position): bool
    {
        $this->update([
            'signed_by' => $signedBy,
            'signature_position' => $position,
            'signed_at' => now()
        ]);

        return true;
    }

    public function invalidate(): bool
    {
        $this->update(['is_valid' => false]);
        return true;
    }
}
