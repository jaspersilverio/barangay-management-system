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
        and a bonafide resident of this Barangay
        @if($resident->household && $resident->household->address)
            with postal address at <strong>{{ $resident->household->address }}</strong>
            @if($resident->household->purok)
                , <strong>{{ $resident->household->purok->name }}</strong>
            @endif
        @endif
        , is known to be a person of <strong>GOOD MORAL CHARACTER</strong> and has <strong>NO DEROGATORY RECORD</strong> 
        filed in this office as of this date.
    </p>

    <p class="body-text">
        This further certifies that the above-named person has no pending case or complaint 
        filed against him/her in this Barangay.
    </p>

    {{-- Purpose and Validity --}}
    @include('pdf.certificates.partials.certificate-body', ['certificate_type' => 'clearance'])

    {{-- Signatures --}}
    @include('pdf.certificates.partials.signatures')

    {{-- Verification --}}
    @include('pdf.certificates.partials.verification')
@endsection
