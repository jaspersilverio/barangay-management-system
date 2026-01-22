@extends('pdf.layouts.base')

@section('content')
    <div class="text-center mb-4">
        <div class="document-title">{{ $document_title ?? ($certificate->certificate_type_label ?? 'CERTIFICATE') }}</div>
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
            @if ($resident->age)
                {{ $resident->age }} years of age,
            @else
                of legal age,
            @endif
            @if ($resident->nationality)
                {{ $resident->nationality }},
            @else
                Filipino,
            @endif
            and a resident of {{ $barangay_info['name'] ?? 'this barangay' }},
            @if ($resident->household && $resident->household->address)
                residing at {{ $resident->household->address }},
            @endif
            @if ($resident->household && $resident->household->purok)
                Purok {{ $resident->household->purok->name }},
            @endif
            has requested for a {{ $certificate->certificate_type_label ?? 'certificate' }}.
        </p>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <div class="section-title">Resident Information</div>
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="border: none; padding: 5px 0; width: 30%;"><strong>Full Name:</strong></td>
                    <td style="border: none; padding: 5px 0;">{{ $resident->full_name }}</td>
                </tr>
                @if ($resident->household && $resident->household->address)
                    <tr>
                        <td style="border: none; padding: 5px 0;"><strong>Address:</strong></td>
                        <td style="border: none; padding: 5px 0;">
                            {{ $resident->household->address }}
                            @if ($resident->household->purok)
                                , Purok {{ $resident->household->purok->name }}
                            @endif
                        </td>
                    </tr>
                @endif
                @if ($resident->birthdate)
                    <tr>
                        <td style="border: none; padding: 5px 0;"><strong>Date of Birth:</strong></td>
                        <td style="border: none; padding: 5px 0;">
                            {{ \Carbon\Carbon::parse($resident->birthdate)->format('F d, Y') }}
                            @if ($resident->age)
                                ({{ $resident->age }} years old)
                            @endif
                        </td>
                    </tr>
                @endif
                @if ($resident->place_of_birth)
                    <tr>
                        <td style="border: none; padding: 5px 0;"><strong>Place of Birth:</strong></td>
                        <td style="border: none; padding: 5px 0;">{{ $resident->place_of_birth }}</td>
                    </tr>
                @endif
                @if ($resident->civil_status)
                    <tr>
                        <td style="border: none; padding: 5px 0;"><strong>Civil Status:</strong></td>
                        <td style="border: none; padding: 5px 0;" class="text-capitalize">{{ $resident->civil_status }}
                        </td>
                    </tr>
                @endif
                @if ($resident->sex)
                    <tr>
                        <td style="border: none; padding: 5px 0;"><strong>Sex:</strong></td>
                        <td style="border: none; padding: 5px 0;" class="text-capitalize">{{ $resident->sex }}</td>
                    </tr>
                @endif
                @if ($resident->contact_number)
                    <tr>
                        <td style="border: none; padding: 5px 0;"><strong>Contact Number:</strong></td>
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
            This certificate is valid from
            <strong>{{ $valid_from_formatted ?? \Carbon\Carbon::parse($certificate->valid_from)->format('F d, Y') }}</strong>
            to
            <strong>{{ $valid_until_formatted ?? \Carbon\Carbon::parse($certificate->valid_until)->format('F d, Y') }}</strong>.
        </p>

        <p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
            Issued this
            <strong>{{ $issued_date_formatted ?? \Carbon\Carbon::parse($certificate->created_at)->format('F d, Y') }}</strong>
            at {{ $barangay_info['name'] ?? 'this barangay' }}, {{ $barangay_info['address'] ?? '' }}.
        </p>
    </div>

    <div class="signature-section">
        @php
            // Use settings for signature if available, otherwise fall back to certificate data
            $signaturePath = $barangay_info['captain_signature_path'] ?? null;
            $signatureDisplayName =
                $certificate->signed_by ??
                ($barangay_info['captain_signature_display_name'] ??
                    ($barangay_info['captain_name'] ?? 'Barangay Captain'));
            $signaturePosition =
                $certificate->signature_position ?? ($barangay_info['captain_position_label'] ?? 'Punong Barangay');
        @endphp

        @if (isset($captain) && $captain['signature_base64'])
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="{{ $captain['signature_base64'] }}" alt="Signature"
                    style="max-width: 200px; max-height: 80px; object-fit: contain;">
            </div>
        @elseif($signaturePath && Storage::disk('public')->exists($signaturePath))
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="{{ Storage::disk('public')->url($signaturePath) }}" alt="Signature"
                    style="max-width: 200px; max-height: 80px; object-fit: contain;">
            </div>
        @else
            <div class="signature-line"></div>
        @endif
        <div class="signature-name">{{ $signatureDisplayName }}</div>
        <div class="signature-position">{{ $signaturePosition }}</div>
    </div>

    @php
        // Use settings for secretary and treasurer
        $secretaryName = $barangay_info['secretary_name'] ?? null;
        $treasurerName = $barangay_info['treasurer_name'] ?? null;
    @endphp

    @if ($secretaryName || $treasurerName || (!empty($officials) && count($officials) > 1))
        <div style="margin-top: 30px; display: flex; justify-content: space-around; flex-wrap: wrap;">
            @if ($secretaryName)
                <div style="text-align: center; margin: 10px;">
                    <div style="border-top: 1px solid #333; width: 200px; margin: 10px auto 5px;"></div>
                    <div style="font-weight: bold; margin-top: 5px;">{{ $secretaryName }}</div>
                    <div style="font-size: 10pt; color: #555;">Barangay Secretary</div>
                </div>
            @elseif(isset($officials['secretary']))
                <div style="text-align: center; margin: 10px;">
                    <div style="border-top: 1px solid #333; width: 200px; margin: 10px auto 5px;"></div>
                    <div style="font-weight: bold; margin-top: 5px;">
                        {{ $officials['secretary']['name'] ?? 'Barangay Secretary' }}</div>
                    <div style="font-size: 10pt; color: #555;">
                        {{ $officials['secretary']['position'] ?? 'Barangay Secretary' }}</div>
                </div>
            @endif
            @if ($treasurerName)
                <div style="text-align: center; margin: 10px;">
                    <div style="border-top: 1px solid #333; width: 200px; margin: 10px auto 5px;"></div>
                    <div style="font-weight: bold; margin-top: 5px;">{{ $treasurerName }}</div>
                    <div style="font-size: 10pt; color: #555;">Barangay Treasurer</div>
                </div>
            @elseif(isset($officials['treasurer']))
                <div style="text-align: center; margin: 10px;">
                    <div style="border-top: 1px solid #333; width: 200px; margin: 10px auto 5px;"></div>
                    <div style="font-weight: bold; margin-top: 5px;">
                        {{ $officials['treasurer']['name'] ?? 'Barangay Treasurer' }}</div>
                    <div style="font-size: 10pt; color: #555;">
                        {{ $officials['treasurer']['position'] ?? 'Barangay Treasurer' }}</div>
                </div>
            @endif
        </div>
    @endif

    @if (!empty($qr_code_data))
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
