<div style="margin-top: 10px;">
    <table style="width: 100%; border: none; margin: 0; font-size: 9pt;">
        <tr>
            <td style="border: none; padding: 2px 0; width: 50%;">
                <strong>Valid From:</strong> {{ $valid_from_formatted ?? (isset($certificate->valid_from) && $certificate->valid_from ? \Carbon\Carbon::parse($certificate->valid_from)->format('F d, Y') : 'N/A') }}
            </td>
            <td style="border: none; padding: 2px 0; width: 50%;">
                <strong>Valid Until:</strong> {{ $valid_until_formatted ?? (isset($certificate->valid_until) && $certificate->valid_until ? \Carbon\Carbon::parse($certificate->valid_until)->format('F d, Y') : 'N/A') }}
            </td>
        </tr>
        @if(!empty($certificate->certificate_number))
        <tr>
            <td colspan="2" style="border: none; padding: 2px 0;">
                <strong>Document Control No.:</strong> {{ $certificate->certificate_number }}
            </td>
        </tr>
        @endif
    </table>
</div>

@if(!empty($qr_code_data))
<div style="margin-top: 5px; text-align: center; font-size: 7pt; color: #666;">
    <strong>Verification:</strong> <span style="font-family: monospace; font-size: 6pt; word-break: break-all;">{{ substr($qr_code_data, 0, 80) }}...</span>
</div>
@endif
