@extends('pdf.layouts.base')

@section('content')
    <div class="text-center mb-4">
        <div class="document-title">{{ $certificate->certificate_type_label ?? 'CERTIFICATE' }}</div>
        <div style="font-size: 11pt; color: #666; margin-top: 10px;">
            Certificate Number: <strong>{{ $certificate->certificate_number }}</strong>
        </div>
    </div>

    <div class="section">
        <p style="text-align: justify; margin: 20px 0;">
            <strong>TO WHOM IT MAY CONCERN:</strong>
        </p>

        <p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
            This is to certify that <strong>{{ $resident->full_name }}</strong>,
            of legal age, Filipino, and a resident of {{ $barangay_info['name'] ?? 'this barangay' }},
            has requested for a {{ $certificate->certificate_type_label ?? 'certificate' }}.
        </p>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <div class="section-title">Resident Information</div>
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="border: none; padding: 5px 0; width: 30%;"><strong>Name:</strong></td>
                    <td style="border: none; padding: 5px 0;">{{ $resident->full_name }}</td>
                </tr>
                <tr>
                    <td style="border: none; padding: 5px 0;"><strong>Address:</strong></td>
                    <td style="border: none; padding: 5px 0;">{{ $resident->address ?? 'Not specified' }}</td>
                </tr>
                @if(!empty($resident->contact_number))
                <tr>
                    <td style="border: none; padding: 5px 0;"><strong>Contact:</strong></td>
                    <td style="border: none; padding: 5px 0;">{{ $resident->contact_number }}</td>
                </tr>
                @endif
            </table>
        </div>

        <p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
            This certification is being issued upon the request of the above-named person
            for <strong>{{ $certificate->purpose }}</strong>.
        </p>

        <p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
            This certificate is valid from <strong>{{ $valid_from_formatted ?? $certificate->valid_from }}</strong>
            to <strong>{{ $valid_until_formatted ?? $certificate->valid_until }}</strong>.
        </p>

        <p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
            Issued this <strong>{{ $issued_date_formatted ?? $certificate->created_at->format('F d, Y') }}</strong>
            at {{ $barangay_info['name'] ?? 'this barangay' }}.
        </p>
    </div>

    <div class="signature-section">
        <div class="signature-line"></div>
        <div class="signature-name">{{ $certificate->signed_by ?? 'Barangay Captain' }}</div>
        <div class="signature-position">{{ $certificate->signature_position ?? 'Barangay Captain' }}</div>
    </div>

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
@endsection

