<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Vaccination Masterlist Report' }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 15mm 15mm 20mm 15mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            color: #000;
        }

        /* ==================== HEADER (MATCH CERTIFICATE STYLE) ==================== */
        .certificate-header {
            text-align: center;
            margin-top: 0;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .header-logo-container {
            text-align: center;
            margin-bottom: 8px;
        }

        .header-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
        }

        .logo-placeholder {
            width: 70px;
            height: 70px;
            margin: 0 auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #1a5276, #2874a6);
            color: white;
            font-size: 28pt;
            font-weight: bold;
            line-height: 70px;
            text-align: center;
        }

        .gov-header {
            font-size: 11pt;
            font-weight: normal;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
            line-height: 1.4;
        }

        .location-header {
            font-size: 11pt;
            font-weight: normal;
            margin: 2px 0;
            line-height: 1.4;
        }

        .brgy-header {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 0 0 0;
            color: #1a1a1a;
        }

        .header-separator {
            border: none;
            border-top: 1px solid #333;
            margin: 12px auto 15px auto;
            width: 100%;
        }

        .document-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin: 5px 0 10px;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-decoration: underline;
            text-underline-offset: 6px;
        }

        .filter-info {
            font-size: 9pt;
            color: #333;
            margin-top: 8px;
            text-align: center;
        }

        .filter-info span {
            margin: 0 10px;
        }

        /* ==================== SUMMARY BOX ==================== */
        .summary-section {
            margin: 15px 0;
            border: 1px solid #333;
            padding: 12px;
            background-color: #f9f9f9;
        }

        .summary-title {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }

        .summary-table {
            width: 100%;
            border: none;
        }

        .summary-table td {
            border: none;
            padding: 5px 10px;
            font-size: 9pt;
            width: 33.33%;
        }

        .summary-label {
            font-weight: bold;
            color: #333;
        }

        .summary-value {
            font-weight: normal;
            color: #000;
        }

        /* ==================== MAIN TABLE ==================== */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 8pt;
        }

        .data-table thead {
            display: table-header-group;
        }

        .data-table th {
            background-color: #e0e0e0;
            border: 1px solid #333;
            padding: 6px 4px;
            text-align: center;
            font-weight: bold;
            font-size: 8pt;
            text-transform: uppercase;
        }

        .data-table td {
            border: 1px solid #666;
            padding: 5px 4px;
            vertical-align: top;
            word-wrap: break-word;
        }

        .data-table tbody tr:nth-child(even) {
            background-color: #f5f5f5;
        }

        .data-table tbody tr:nth-child(odd) {
            background-color: #fff;
        }

        /* Column alignments */
        .col-no {
            width: 4%;
            text-align: center;
        }

        .col-name {
            width: 16%;
            text-align: left;
        }

        .col-sex {
            width: 5%;
            text-align: center;
        }

        .col-age {
            width: 5%;
            text-align: center;
        }

        .col-purok {
            width: 8%;
            text-align: center;
        }

        .col-address {
            width: 14%;
            text-align: left;
        }

        .col-vaccine {
            width: 12%;
            text-align: left;
        }

        .col-dose {
            width: 6%;
            text-align: center;
        }

        .col-date {
            width: 10%;
            text-align: center;
        }

        .col-vaccinator {
            width: 10%;
            text-align: left;
        }

        .col-next {
            width: 10%;
            text-align: center;
        }

        .text-center {
            text-align: center;
        }

        .text-left {
            text-align: left;
        }

        .text-uppercase {
            text-transform: uppercase;
        }

        .text-bold {
            font-weight: bold;
        }

        /* ==================== SIGNATURE SECTION ==================== */
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            border: none;
        }

        .signature-table td {
            border: none;
            padding: 0;
            vertical-align: top;
            width: 50%;
        }

        .signature-block {
            padding: 10px 20px;
        }

        .signature-label {
            font-size: 9pt;
            margin-bottom: 30px;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin-top: 5px;
        }

        .signature-name {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
        }

        .signature-position {
            font-size: 9pt;
            color: #333;
        }

        /* ==================== FOOTER ==================== */
        .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
        }

        .footer-text {
            font-style: italic;
        }

        /* ==================== EMPTY STATE ==================== */
        .empty-row td {
            text-align: center;
            padding: 30px;
            font-style: italic;
            color: #666;
        }

        /* Print styles */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>
    {{-- ==================== PAGE HEADER (CERTIFICATE-STYLE) ==================== --}}
    @php
        $gdAvailable = extension_loaded('gd');
        $showLogo = false;
        $logoSrc = null;

        if (
            $gdAvailable &&
            !empty($barangay_info['logo_base64']) &&
            str_starts_with($barangay_info['logo_base64'], 'data:')
        ) {
            $showLogo = true;
            $logoSrc = $barangay_info['logo_base64'];
        }
    @endphp

    <div class="certificate-header">
        {{-- Logo at the very top --}}
        <div class="header-logo-container">
            @if ($showLogo && $logoSrc)
                <img src="{{ $logoSrc }}" alt="Barangay Seal" class="header-logo">
            @else
                <div class="logo-placeholder">B</div>
            @endif
        </div>

        {{-- Government hierarchy text --}}
        <div class="gov-header">Republic of the Philippines</div>
        <div class="location-header">
            @if (!empty($barangay_info['province']))
                Province of {{ $barangay_info['province'] }}
            @else
                Province of Capiz
            @endif
        </div>
        <div class="location-header">
            @if (!empty($barangay_info['municipality']))
                Municipality of {{ $barangay_info['municipality'] }}
            @else
                Municipality of Ivisan
            @endif
        </div>
        <div class="brgy-header">
            Barangay {{ $barangay_info['name'] ?? 'Poblacion Sur' }}
        </div>

        {{-- Thin separator line before title --}}
        <hr class="header-separator">
    </div>

    {{-- ==================== TITLE & FILTERS (below shared header) ==================== --}}
    <div>
        <div class="document-title">{{ $document_title ?? 'VACCINATION MASTERLIST REPORT' }}</div>
        <div class="filter-info">
            <span><strong>Date Range:</strong> {{ $filters['date_range'] ?? 'All Dates' }}</span>
            <span>|</span>
            <span><strong>Vaccine:</strong> {{ $filters['vaccine'] ?? 'All Vaccines' }}</span>
            <span>|</span>
            <span><strong>Purok:</strong> {{ $filters['purok'] ?? 'All Puroks' }}</span>
            <span>|</span>
            <span><strong>Status:</strong> {{ $filters['status'] ?? 'All Status' }}</span>
        </div>
    </div>

    {{-- ==================== SUMMARY SECTION ==================== --}}
    <div class="summary-section">
        <div class="summary-title">Summary Statistics</div>
        <table class="summary-table">
            <tr>
                <td>
                    <span class="summary-label">Total Vaccination Records:</span>
                    <span class="summary-value">{{ number_format($summary['total_records'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Unique Residents Vaccinated:</span>
                    <span class="summary-value">{{ number_format($summary['unique_residents'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Most Common Vaccine:</span>
                    <span class="summary-value">{{ $summary['most_common_vaccine'] ?? 'N/A' }}</span>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="summary-label">Fully Vaccinated (Completed):</span>
                    <span class="summary-value">{{ number_format($summary['fully_vaccinated'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Partially Vaccinated:</span>
                    <span class="summary-value">{{ number_format($summary['partially_vaccinated'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Pending Vaccinations:</span>
                    <span class="summary-value">{{ number_format($summary['pending'] ?? 0) }}</span>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== DATA TABLE ==================== --}}
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-name">Full Name</th>
                <th class="col-sex">Sex</th>
                <th class="col-age">Age</th>
                <th class="col-purok">Purok</th>
                <th class="col-address">Address</th>
                <th class="col-vaccine">Vaccine</th>
                <th class="col-dose">Dose</th>
                <th class="col-date">Date Vaccinated</th>
                <th class="col-vaccinator">Vaccinator</th>
                <th class="col-next">Next Schedule</th>
            </tr>
        </thead>
        <tbody>
            @forelse($vaccinations as $index => $vaccination)
                @php
                    $resident = $vaccination->resident;

                    // Format name as: LAST NAME, First Name Middle Name
                    $fullName = 'N/A';
                    if ($resident) {
                        $lastName = strtoupper($resident->last_name ?? '');
                        $firstName = ucfirst(strtolower($resident->first_name ?? ''));
                        $middleName = '';
                        if (!empty($resident->middle_name)) {
                            $middleName = ' ' . ucfirst(strtolower($resident->middle_name));
                        }
                        $fullName = $lastName . ', ' . $firstName . $middleName;
                    }

                    // Get purok name
                    $purok = 'N/A';
                    if ($resident && $resident->household && $resident->household->purok) {
                        $purok = $resident->household->purok->name;
                    }

                    // Get address
                    $address = 'N/A';
                    if ($resident && $resident->household) {
                        $address = $resident->household->address ?? 'N/A';
                    }

                    // Format dates
                    $dateAdministered = $vaccination->date_administered
                        ? \Carbon\Carbon::parse($vaccination->date_administered)->format('M d, Y')
                        : 'N/A';

                    $nextDueDate = $vaccination->next_due_date
                        ? \Carbon\Carbon::parse($vaccination->next_due_date)->format('M d, Y')
                        : 'N/A';
                @endphp
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-name text-bold">{{ $fullName }}</td>
                    <td class="col-sex">{{ $resident ? ucfirst($resident->sex ?? 'N/A') : 'N/A' }}</td>
                    <td class="col-age">{{ $resident ? $resident->age ?? 'N/A' : 'N/A' }}</td>
                    <td class="col-purok">{{ $purok }}</td>
                    <td class="col-address">{{ $address }}</td>
                    <td class="col-vaccine">{{ $vaccination->vaccine_name ?? 'N/A' }}</td>
                    <td class="col-dose">{{ $vaccination->dose_number ?? 'N/A' }}</td>
                    <td class="col-date">{{ $dateAdministered }}</td>
                    <td class="col-vaccinator">{{ $vaccination->administered_by ?? 'N/A' }}</td>
                    <td class="col-next">{{ $nextDueDate }}</td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="11">No vaccination records found matching the specified criteria.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Total Records Count --}}
    <div style="text-align: right; font-size: 9pt; margin-top: 10px; font-weight: bold;">
        Total Records: {{ $vaccinations->count() }}
    </div>

    {{-- ==================== SIGNATURE SECTION ==================== --}}
    @php
        $gdAvailable = extension_loaded('gd');
        $hasSignature =
            $gdAvailable &&
            !empty($noted_by['signature_base64']) &&
            str_starts_with($noted_by['signature_base64'], 'data:');
    @endphp
    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td style="width: 100%; text-align: right;">
                    <div class="signature-block" style="text-align: right; margin-left: auto;">
                        <div class="signature-label">Noted by:</div>
                        @if ($hasSignature)
                            <img src="{{ $noted_by['signature_base64'] }}" alt="Signature"
                                style="max-width: 150px; max-height: 60px; display: block; margin-left: auto; margin-bottom: 5px;">
                        @else
                            <div class="signature-line" style="margin-left: auto;"></div>
                        @endif
                        <div class="signature-name">{{ $noted_by['name'] ?? 'BARANGAY CAPTAIN' }}</div>
                        <div class="signature-position">{{ $noted_by['position'] ?? 'Punong Barangay' }}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== FOOTER ==================== --}}
    <div class="page-footer">
        <div class="footer-text">Official Barangay Vaccination Report – System Generated</div>
        <div>Generated on {{ $generated_date ?? date('F d, Y') }} at {{ $generated_time ?? date('h:i A') }}</div>
    </div>
</body>

</html>
