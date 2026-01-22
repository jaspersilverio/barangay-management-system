@extends('pdf.layouts.base')

@section('content')
    <div class="text-center mb-4">
        <div class="document-title">BARANGAY CLEARANCE</div>
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
            is a person of good moral character and law-abiding citizen of this barangay.
        </p>

        @include('pdf.certificates.partials.resident-info')
        @include('pdf.certificates.partials.certificate-body', ['certificate_type' => 'clearance'])
        @include('pdf.certificates.partials.signatures')
        @include('pdf.certificates.partials.verification')
    </div>
@endsection
