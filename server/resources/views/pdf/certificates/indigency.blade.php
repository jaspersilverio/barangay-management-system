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
        and a resident of Barangay {{ $barangay_info['name'] ?? '' }}
        @if($resident->household && $resident->household->address)
            with address at <strong>{{ $resident->household->address }}</strong>
            @if($resident->household->purok)
                , <strong>{{ $resident->household->purok->name }}</strong>
            @endif
        @endif
        , belongs to an <strong>INDIGENT FAMILY</strong> in this Barangay.
    </p>

    <p class="body-text">
        This certifies that the above-named individual and his/her family do not have 
        sufficient income to meet the basic necessities of life. This certification is 
        being issued to support his/her request for financial assistance or any related benefits.
    </p>

    {{-- Purpose and Validity --}}
    @include('pdf.certificates.partials.certificate-body', ['certificate_type' => 'certificate'])

    {{-- Signatures --}}
    @include('pdf.certificates.partials.signatures')

    {{-- Verification --}}
    @include('pdf.certificates.partials.verification')
@endsection
