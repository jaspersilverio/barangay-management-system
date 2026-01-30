{{-- Signature Section --}}
@php
    $gdAvailable = extension_loaded('gd');
    
    // Get captain info - prioritize Officials table (most up-to-date), then User account, then certificate record
    $captainName = $officials['captain']['name'] ?? ($captain['name'] ?? ($barangay_info['captain_name'] ?? $certificate->signed_by ?? ''));
    $captainPosition = 'Punong Barangay';
    
    // Check if signature is available (GD required for rendering, must be valid base64)
    $hasSignature = $gdAvailable && isset($captain) && !empty($captain['signature_base64']) && str_starts_with($captain['signature_base64'], 'data:');
    $signatureSrc = $hasSignature ? $captain['signature_base64'] : null;
@endphp

{{-- Punong Barangay Signature (Right-aligned, prominent) --}}
<div style="margin-top: 40px; text-align: right; padding-right: 40px;">
    <div style="display: inline-block; text-align: center; min-width: 200px;">
        @if($hasSignature && $signatureSrc)
            <img src="{{ $signatureSrc }}" alt="Signature" style="max-width: 150px; max-height: 60px; display: block; margin: 0 auto 5px;">
        @else
            <div style="height: 40px;"></div>
            <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto;"></div>
        @endif
        <div style="font-weight: bold; font-size: 12pt; margin-top: 5px; text-transform: uppercase;">{{ $captainName }}</div>
        <div style="font-size: 10pt; font-style: italic; color: #333;">{{ $captainPosition }}</div>
    </div>
</div>
