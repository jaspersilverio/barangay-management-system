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
        , is hereby granted this <strong>BARANGAY BUSINESS CLEARANCE/ENDORSEMENT</strong>.
    </p>

    <p class="body-text">
        The Barangay has <strong>NO OBJECTION</strong> to the establishment/operation of the 
        business within the territorial jurisdiction of this Barangay, subject to the rules 
        and regulations prescribed by the local government and other concerned agencies.
    </p>

    <p class="body-text">
        This clearance is issued subject to the following conditions:
    </p>
    
    <div style="margin: 10px 0 10px 30px; font-size: 10pt; line-height: 1.6;">
        <div>1. The business shall comply with all applicable laws, ordinances, and regulations.</div>
        <div>2. The business shall not cause any nuisance or disturbance to the community.</div>
        <div>3. The business shall secure all necessary permits from concerned government agencies.</div>
        <div>4. This clearance may be revoked for violations of any of the above conditions.</div>
    </div>

    {{-- Purpose and Validity --}}
    @include('pdf.certificates.partials.certificate-body', ['certificate_type' => 'clearance'])

    {{-- Signatures --}}
    @include('pdf.certificates.partials.signatures')

    {{-- Verification --}}
    @include('pdf.certificates.partials.verification')
@endsection
