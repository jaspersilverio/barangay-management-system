@if(!empty($qr_code_data))
<div class="text-center mt-4" style="margin-top: 30px;">
    <div style="font-size: 9pt; color: #666;">
        <strong>Verification Code:</strong> {{ $qr_code_data }}
    </div>
    <div style="font-size: 8pt; color: #888; margin-top: 5px;">
        This document is computer-generated and does not require a wet signature.
    </div>
</div>
@endif
