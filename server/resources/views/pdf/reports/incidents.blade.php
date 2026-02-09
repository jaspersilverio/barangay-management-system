<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Incident Reports' }}</title>
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

        /* ==================== HEADER (MATCH CERTIFICATE/VACCINATION STYLE) ==================== */
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
            width: 16.66%;
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
        .col-no { width: 4%; text-align: center; }
        .col-date { width: 10%; text-align: center; }
        .col-title { width: 18%; text-align: left; }
        .col-location { width: 12%; text-align: left; }
        .col-description { width: 20%; text-align: left; }
        .col-persons { width: 14%; text-align: left; }
        .col-status { width: 8%; text-align: center; }
        .col-officer { width: 10%; text-align: left; }
        .col-reported { width: 9%; text-align: center; }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-uppercase { text-transform: uppercase; }
        .text-bold { font-weight: bold; }

        .title-text {
            font-weight: bold;
        }

        .sub-info {
            font-size: 7pt;
            color: #555;
            margin-top: 2px;
        }

        /* Status badges */
        .status-recorded { color: #666; }
        .status-monitoring { color: #856404; }
        .status-resolved { color: #155724; }
        .status-pending { color: #0c5460; }

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
        if ($gdAvailable && !empty($barangay_info['logo_base64']) && str_starts_with($barangay_info['logo_base64'] ?? '', 'data:')) {
            $showLogo = true;
            $logoSrc = $barangay_info['logo_base64'];
        }
    @endphp

    <div class="certificate-header">
        <div class="header-logo-container">
            @if ($showLogo && $logoSrc)
                <img src="{{ $logoSrc }}" alt="Barangay Seal" class="header-logo">
            @else
                <div class="logo-placeholder">B</div>
            @endif
        </div>
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
            Barangay {{ $barangay_info['barangay_name'] ?? $barangay_info['name'] ?? 'Poblacion Sur' }}
        </div>
        <hr class="header-separator">
    </div>

    {{-- ==================== TITLE & FILTERS ==================== --}}
    <div>
        <div class="document-title">{{ $document_title ?? 'INCIDENT REPORTS MASTERLIST' }}</div>
        <div class="filter-info">
            <span><strong>Date Range:</strong> {{ $filters['date_range'] ?? 'All Dates' }}</span>
            <span>|</span>
            <span><strong>Status:</strong> {{ $filters['status'] ?? 'All Status' }}</span>
            @if(isset($filters['search']) && $filters['search'])
                <span>|</span>
                <span><strong>Search:</strong> {{ $filters['search'] }}</span>
            @endif
        </div>
    </div>

    {{-- ==================== SUMMARY SECTION ==================== --}}
    <div class="summary-section">
        <div class="summary-title">Incident Reports Summary</div>
        <table class="summary-table">
            <tr>
                <td>
                    <span class="summary-label">Total Reports:</span>
                    <span class="summary-value">{{ number_format($summary['total_reports'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Recorded:</span>
                    <span class="summary-value">{{ number_format($summary['recorded'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Monitoring:</span>
                    <span class="summary-value">{{ number_format($summary['monitoring'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Resolved:</span>
                    <span class="summary-value">{{ number_format($summary['resolved'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Pending Approval:</span>
                    <span class="summary-value">{{ number_format($summary['pending'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Approved:</span>
                    <span class="summary-value">{{ number_format($summary['approved'] ?? 0) }}</span>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== DATA TABLE ==================== --}}
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-date">Date & Time</th>
                <th class="col-title">Incident Title</th>
                <th class="col-location">Location</th>
                <th class="col-description">Description</th>
                <th class="col-persons">Persons Involved</th>
                <th class="col-status">Status</th>
                <th class="col-officer">Reporting Officer</th>
                <th class="col-reported">Date Reported</th>
            </tr>
        </thead>
        <tbody>
            @forelse($incident_reports as $index => $report)
                @php
                    // Format date and time
                    $incidentDateTime = 'N/A';
                    if ($report->incident_date) {
                        $incidentDateTime = \Carbon\Carbon::parse($report->incident_date)->format('M d, Y');
                        if ($report->incident_time) {
                            $incidentDateTime .= ' ' . \Carbon\Carbon::parse($report->incident_time)->format('h:i A');
                        }
                    }
                    
                    // Format reported date
                    $reportedDate = $report->created_at 
                        ? \Carbon\Carbon::parse($report->created_at)->format('M d, Y')
                        : 'N/A';
                    
                    // Get description (truncate if too long)
                    $description = $report->description ?? 'N/A';
                    if (strlen($description) > 100) {
                        $description = substr($description, 0, 100) . '...';
                    }
                    
                    // Get persons involved
                    $personsInvolved = 'N/A';
                    if ($report->persons_involved) {
                        if (is_array($report->persons_involved)) {
                            $personsInvolved = implode(', ', $report->persons_involved);
                        } else {
                            $personsInvolved = $report->persons_involved;
                        }
                        if (strlen($personsInvolved) > 60) {
                            $personsInvolved = substr($personsInvolved, 0, 60) . '...';
                        }
                    }
                    
                    // Get reporting officer
                    $reportingOfficer = 'N/A';
                    if ($report->reportingOfficer) {
                        $reportingOfficer = $report->reportingOfficer->name;
                    }
                    
                    // Status class
                    $statusClass = 'status-recorded';
                    $status = $report->status ?? 'Recorded';
                    if ($status === 'Monitoring') {
                        $statusClass = 'status-monitoring';
                    } elseif ($status === 'Resolved') {
                        $statusClass = 'status-resolved';
                    } elseif ($status === 'pending') {
                        $statusClass = 'status-pending';
                    }
                @endphp
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-date">{{ $incidentDateTime }}</td>
                    <td class="col-title">
                        <div class="title-text">{{ $report->incident_title ?? 'N/A' }}</div>
                    </td>
                    <td class="col-location">{{ $report->location ?? 'N/A' }}</td>
                    <td class="col-description">{{ $description }}</td>
                    <td class="col-persons">{{ $personsInvolved }}</td>
                    <td class="col-status {{ $statusClass }}">
                        <strong>{{ ucfirst($status) }}</strong>
                    </td>
                    <td class="col-officer">{{ $reportingOfficer }}</td>
                    <td class="col-reported">{{ $reportedDate }}</td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="9">No incident reports found matching the specified criteria.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Total Records Count --}}
    <div style="text-align: right; font-size: 9pt; margin-top: 10px; font-weight: bold;">
        Total Records: {{ $incident_reports->count() }}
    </div>

    {{-- ==================== SIGNATURE SECTION ==================== --}}
    @php
        $gdAvailable = extension_loaded('gd');
        $hasSignature = $gdAvailable && !empty($noted_by['signature_base64']) && str_starts_with($noted_by['signature_base64'], 'data:');
    @endphp
    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td>
                    <div class="signature-block">
                        <div class="signature-label">Prepared by:</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">{{ $prepared_by['name'] ?? 'SYSTEM ADMINISTRATOR' }}</div>
                        <div class="signature-position">{{ $prepared_by['position'] ?? 'Staff' }}</div>
                    </div>
                </td>
                <td>
                    <div class="signature-block" style="text-align: right;">
                        <div class="signature-label">Noted by:</div>
                        @if($hasSignature)
                            <img src="{{ $noted_by['signature_base64'] }}" alt="Signature" style="max-width: 150px; max-height: 60px; display: block; margin-left: auto; margin-bottom: 5px;">
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
        <div class="footer-text">Official Barangay Incident Reports – System Generated</div>
        <div>Generated on {{ $generated_date ?? date('F d, Y') }} at {{ $generated_time ?? date('h:i A') }}</div>
    </div>
</body>
</html>
