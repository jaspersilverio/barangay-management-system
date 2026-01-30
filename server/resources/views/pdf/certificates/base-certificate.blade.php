@extends('pdf.layouts.base')

@section('content')
    {{-- Greeting --}}
    <p class="greeting">TO WHOM IT MAY CONCERN:</p>

    {{-- Main Certification Body --}}
    <p class="body-text">
        This is to certify that <strong>{{ strtoupper($resident->full_name) }}</strong>,
        @if($resident->age)
            <strong>{{ $resident->age }}</strong> years of age,
        @else
            of legal age,
        @endif
        @if($resident->civil_status)
            {{ $resident->civil_status }},
        @endif
        @if($resident->nationality)
            {{ $resident->nationality }},
        @else
            Filipino citizen,
        @endif
        and a bonafide resident of Barangay {{ $barangay_info['name'] ?? '' }}
        @if($resident->household && $resident->household->address)
            with residential address at <strong>{{ $resident->household->address }}</strong>
            @if($resident->household->purok)
                , <strong>{{ $resident->household->purok->name }}</strong>
            @endif
        @endif
        , has requested for a <strong>{{ strtoupper($certificate->certificate_type_label ?? 'CERTIFICATE') }}</strong>.
    </p>

    <p class="body-text">
        Based on our records, the above-named person is a law-abiding citizen and has no 
        derogatory record filed in this Barangay as of this date.
    </p>

    {{-- Purpose and Validity --}}
    @include('pdf.certificates.partials.certificate-body', ['certificate_type' => 'certificate'])

    {{-- Signatures --}}
    @include('pdf.certificates.partials.signatures')

    {{-- Verification --}}
    @include('pdf.certificates.partials.verification')
@endsection
