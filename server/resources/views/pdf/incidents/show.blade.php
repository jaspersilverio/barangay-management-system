@extends('pdf.layouts.base')

@section('content')
    @php
        $reportId = $incident->id;
        $incidentTitle = $incident->incident_title ?? 'N/A';
        $status = ucfirst($incident->status ?? 'N/A');
        $incidentDate = $incident->incident_date
            ? \Carbon\Carbon::parse($incident->incident_date)->format('F d, Y')
            : 'N/A';
        $incidentTime = $incident->incident_time
            ? \Carbon\Carbon::parse($incident->incident_time)->format('h:i A')
            : 'N/A';
        $reportedAt = $incident->created_at
            ? \Carbon\Carbon::parse($incident->created_at)->format('F d, Y \a\t g:i A')
            : 'N/A';
        $preparedByName = $prepared_by['name'] ?? 'SYSTEM ADMINISTRATOR';
        $preparedByPosition = $prepared_by['position'] ?? 'Staff';
        $barangayName = $barangay_info['barangay_name'] ?? ($barangay_info['name'] ?? 'Barangay');
        $municipality = $barangay_info['municipality'] ?? '';
        $province = $barangay_info['province'] ?? '';
        $location = $incident->location ?? 'N/A';
        $description = $incident->description ?? 'N/A';
        $reportingOfficer = optional($incident->reportingOfficer)->name ?? 'N/A';
        $creator = optional($incident->creator)->name ?? 'N/A';

        $personsInvolved = $incident->persons_involved ?? [];
        if (is_string($personsInvolved)) {
            $personsInvolved = array_filter(array_map('trim', explode(',', $personsInvolved)));
        } elseif (is_array($personsInvolved)) {
            $personsInvolved = array_filter(array_map('trim', $personsInvolved));
        } else {
            $personsInvolved = [];
        }
        $personsList = !empty($personsInvolved) ? implode(', ', $personsInvolved) : null;
    @endphp

    <div class="section" style="margin-top: 10px;">
        <div style="text-align: center; font-size: 11pt; margin-bottom: 20px;">
            Barangay
            {{ $barangayName }}{{ $municipality ? ', ' . $municipality : '' }}{{ $province ? ', ' . $province : '' }}
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-weight: bold; font-size: 13pt;">{{ $incidentTitle }}</span>
            <span style="margin: 0 8px;">|</span>
            <span style="text-transform: uppercase;">{{ $status }}</span>
        </div>

        <div style="font-size: 11pt; line-height: 1.7; text-align: justify;">
            <p style="text-indent: 40px; margin-bottom: 12px;">
                This report is submitted in reference to incident report <strong>#{{ $reportId }}</strong> titled
                <strong>{{ $incidentTitle }}</strong>, which was recorded on {{ $reportedAt }}. The incident occurred
                on {{ $incidentDate }} at {{ $incidentTime }} and took place at {{ $location }}. This report is
                currently classified as <strong>{{ $status }}</strong>.
            </p>


            <p style="text-indent: 40px; margin-bottom: 12px;">
                <strong>Narrative of the Incident:</strong> {{ $description }}
            </p>

            @if ($personsList)
                <p style="text-indent: 40px; margin-bottom: 12px;">
                    <strong>Persons Involved:</strong> {{ $personsList }}
                </p>
            @endif

            @if (!empty($incident->notes))
                <p style="text-indent: 40px; margin-bottom: 12px;">
                    <strong>Additional Notes:</strong> {{ $incident->notes }}
                </p>
            @endif
        </div>

        <div style="margin-top: 35px; width: 55%; margin-left: auto; text-align: center; font-size: 11pt;">
            <p style="margin-bottom: 45px; font-style: italic;">Prepared by:</p>
            <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">{{ $preparedByName }}</p>
            <p style="font-style: italic; margin: 0;">{{ $preparedByPosition }}</p>
        </div>
    </div>

    @php $scriptRef = addslashes('Report #' . $reportId); @endphp
    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->getFont("Times New Roman");
            $size = 9;
            $text = "{{ $scriptRef }}  |  Page {PAGE_NUM} of {PAGE_COUNT}";
            $width = $fontMetrics->get_text_width($text, $font, $size);
            $x = $pdf->get_width() - $width - 40;
            $y = $pdf->get_height() - 25;
            $pdf->page_text($x, $y, $text, $font, $size);
        }
    </script>
@endsection
