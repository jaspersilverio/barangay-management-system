@php
    $gdAvailable = extension_loaded('gd');
    $captainPosition = 'Punong Barangay';
    $captainName =
        $barangay_info['captain_name'] ?? '' ?:
        ($officials['captain'] ?? [])['name'] ?? ($captain['name'] ?? ($certificate->signed_by ?? ''));
    $captainName = trim($captainName) ?: 'Punong Barangay';
    $signatureSrc =
        !empty($barangay_info['captain_signature_base64']) &&
        str_starts_with($barangay_info['captain_signature_base64'], 'data:')
            ? $barangay_info['captain_signature_base64']
            : null;
    $hasSignature = $gdAvailable && $signatureSrc;
@endphp
<div style="margin-top: 40px; text-align: right; padding-right: 40px;">
    <div style="display: inline-block; text-align: center; min-width: 200px;">
        @if ($hasSignature && $signatureSrc)
            <img src="{{ $signatureSrc }}" alt="Signature"
                style="max-width: 150px; max-height: 60px; display: block; margin: 0 auto 5px;">
        @else
            <div style="height: 40px;"></div>
            <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto;"></div>
        @endif
        <div style="font-weight: bold; font-size: 12pt; margin-top: 5px; text-transform: uppercase;">{{ $captainName }}
        </div>
        <div style="font-size: 10pt; font-style: italic; color: #333;">{{ $captainPosition }}</div>
    </div>
</div>
