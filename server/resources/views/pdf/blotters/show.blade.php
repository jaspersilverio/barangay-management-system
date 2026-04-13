@extends('pdf.layouts.base')

@section('content')
    @php
        $caseNumber = $blotter->case_number ?? 'N/A';
        $status = ucfirst($blotter->status ?? 'Ongoing');
        $incidentDate = $blotter->incident_date
            ? \Carbon\Carbon::parse($blotter->incident_date)->format('F d, Y')
            : 'N/A';
        $incidentTime = $blotter->incident_time
            ? \Carbon\Carbon::parse($blotter->incident_time)->format('h:i A')
            : 'N/A';
        $reportedAt = $blotter->created_at
            ? \Carbon\Carbon::parse($blotter->created_at)->format('F d, Y \a\t g:i A')
            : 'N/A';
        $preparedByName = $prepared_by['name'] ?? 'SYSTEM ADMINISTRATOR';
        $preparedByPosition = $prepared_by['position'] ?? 'Staff';
        $barangayName = $barangay_info['barangay_name'] ?? ($barangay_info['name'] ?? 'Barangay');
        $municipality = $barangay_info['municipality'] ?? '';
        $province = $barangay_info['province'] ?? '';

        $complainantName = $blotter->complainant_name;
        $complainantType = $blotter->complainant_is_resident ? 'a resident of this barangay' : 'a non-resident';
        $complainantAddress =
            $blotter->complainant_is_resident && $blotter->complainant
                ? optional($blotter->complainant->household)->address ?? ($blotter->complainant_address ?? 'N/A')
                : $blotter->complainant_address ?? 'N/A';
        $complainantContact =
            $blotter->complainant_is_resident && $blotter->complainant && $blotter->complainant->contact_number
                ? $blotter->complainant->contact_number
                : $blotter->complainant_contact ?? 'N/A';

        $respondentName = $blotter->respondent_name;
        $respondentType = $blotter->respondent_is_resident ? 'a resident of this barangay' : 'a non-resident';
        $respondentAddress =
            $blotter->respondent_is_resident && $blotter->respondent
                ? optional($blotter->respondent->household)->address ?? ($blotter->respondent_address ?? 'N/A')
                : $blotter->respondent_address ?? 'N/A';
        $respondentContact =
            $blotter->respondent_is_resident && $blotter->respondent && $blotter->respondent->contact_number
                ? $blotter->respondent->contact_number
                : $blotter->respondent_contact ?? 'N/A';

        $incidentLocation = $blotter->incident_location ?? 'N/A';
        $assignedOfficial = optional($blotter->official)->name ?? ($blotter->assigned_official_name ?? 'Unassigned');
        $description = $blotter->description ?? 'N/A';
    @endphp

    <div class="section" style="margin-top: 10px;">

        Barangay {{ $barangayName }}{{ $municipality ? ', ' . $municipality : '' }}{{ $province ? ', ' . $province : '' }}
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-weight: bold; font-size: 13pt;">{{ $caseNumber }}</span>
        <span style="margin: 0 8px;">|</span>
        <span style="text-transform: uppercase;">{{ $status }}</span>
    </div>

    <div style="font-size: 11pt; line-height: 1.7; text-align: justify;">
        <p style="text-indent: 40px; margin-bottom: 12px;">
            This report is submitted in reference to Blotter Case Number <strong>{{ $caseNumber }}</strong>, which was
            recorded on {{ $reportedAt }}. The incident occurred on {{ $incidentDate }} at {{ $incidentTime }} and took
            place at {{ $incidentLocation }}. This case is currently classified as <strong>{{ $status }}</strong>.
        </p>

        <p style="text-indent: 40px; margin-bottom: 12px;">
            The complainant is <strong>{{ $complainantName }}</strong>, {{ $complainantType }}, with address at
            {{ $complainantAddress }} and contact number {{ $complainantContact }}. The respondent is
            <strong>{{ $respondentName }}</strong>, {{ $respondentType }}, residing at {{ $respondentAddress }} and may
            be reached at {{ $respondentContact }}.
        </p>

        <p style="text-indent: 40px; margin-bottom: 12px;">
            <strong>Narrative of the Case:</strong> {{ $description }}
        </p>

        @if (!empty($blotter->resolution))
            <p style="text-indent: 40px; margin-bottom: 12px;">
                <strong>Actions Taken / Resolution:</strong> {{ $blotter->resolution }}
            </p>
        @endif

        <p style="text-indent: 40px; margin-bottom: 12px;">
            This matter has been assigned to <strong>{{ $assignedOfficial }}</strong> for handling.
        </p>
    </div>

    <div style="margin-top: 35px; width: 55%; margin-left: auto; text-align: center; font-size: 11pt;">
        <p style="margin-bottom: 45px; font-style: italic;">Prepared by:</p>
        <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">{{ $preparedByName }}</p>
        <p style="font-style: italic; margin: 0;">{{ $preparedByPosition }}</p>
    </div>
    </div>

    @php $caseNumForScript = addslashes($caseNumber); @endphp
    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->getFont("Times New Roman");
            $size = 9;
            $text = "Case {{ $caseNumForScript }}  |  Page {PAGE_NUM} of {PAGE_COUNT}";
            $width = $fontMetrics->get_text_width($text, $font, $size);
            $x = $pdf->get_width() - $width - 40;
            $y = $pdf->get_height() - 25;
            $pdf->page_text($x, $y, $text, $font, $size);
        }
    </script>
@endsection
