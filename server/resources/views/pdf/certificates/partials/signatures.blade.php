<div class="signature-section">
    @if(isset($captain) && $captain['signature_base64'])
        <div style="text-align: center; margin-bottom: 10px;">
            <img src="{{ $captain['signature_base64'] }}" alt="Signature" style="max-width: 200px; max-height: 80px; object-fit: contain;">
        </div>
    @else
        <div class="signature-line"></div>
    @endif
    <div class="signature-name">{{ $certificate->signed_by ?? ($captain['name'] ?? ($officials['captain']['name'] ?? 'Barangay Captain')) }}</div>
    <div class="signature-position">{{ $certificate->signature_position ?? ($captain['position'] ?? ($officials['captain']['position'] ?? 'Barangay Captain')) }}</div>
</div>

@if(!empty($officials) && count($officials) > 1)
<div style="margin-top: 30px; display: flex; justify-content: space-around; flex-wrap: wrap;">
    @if(isset($officials['secretary']))
    <div style="text-align: center; margin: 10px;">
        <div style="border-top: 1px solid #333; width: 200px; margin: 10px auto 5px;"></div>
        <div style="font-weight: bold; margin-top: 5px;">{{ $officials['secretary']['name'] ?? 'Barangay Secretary' }}</div>
        <div style="font-size: 10pt; color: #555;">{{ $officials['secretary']['position'] ?? 'Barangay Secretary' }}</div>
    </div>
    @endif
    @if(isset($officials['treasurer']))
    <div style="text-align: center; margin: 10px;">
        <div style="border-top: 1px solid #333; width: 200px; margin: 10px auto 5px;"></div>
        <div style="font-weight: bold; margin-top: 5px;">{{ $officials['treasurer']['name'] ?? 'Barangay Treasurer' }}</div>
        <div style="font-size: 10pt; color: #555;">{{ $officials['treasurer']['position'] ?? 'Barangay Treasurer' }}</div>
    </div>
    @endif
</div>
@endif
