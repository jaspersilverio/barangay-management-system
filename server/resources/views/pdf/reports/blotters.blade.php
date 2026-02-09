<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Blotter Records Report' }}</title>
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
        .col-case { width: 10%; text-align: center; }
        .col-complainant { width: 14%; text-align: left; }
        .col-respondent { width: 14%; text-align: left; }
        .col-incident-date { width: 9%; text-align: center; }
        .col-location { width: 12%; text-align: left; }
        .col-nature { width: 15%; text-align: left; }
        .col-status { width: 8%; text-align: center; }
        .col-official { width: 10%; text-align: left; }
        .col-reported { width: 9%; text-align: center; }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-uppercase { text-transform: uppercase; }
        .text-bold { font-weight: bold; }

        .name-format {
            font-weight: bold;
        }

        .sub-info {
            font-size: 7pt;
            color: #555;
            margin-top: 2px;
        }

        /* Status badges */
        .status-pending { color: #856404; }
        .status-ongoing { color: #0c5460; }
        .status-resolved { color: #155724; }
        .status-rejected { color: #721c24; }

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
        <div class="document-title">{{ $document_title ?? 'BLOTTER / CASE RECORDS REPORT' }}</div>
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
        <div class="summary-title">Case Summary Statistics</div>
        <table class="summary-table">
            <tr>
                <td>
                    <span class="summary-label">Total Cases:</span>
                    <span class="summary-value">{{ number_format($summary['total_cases'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Pending:</span>
                    <span class="summary-value">{{ number_format($summary['pending'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Ongoing/Open:</span>
                    <span class="summary-value">{{ number_format($summary['ongoing'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Resolved/Settled:</span>
                    <span class="summary-value">{{ number_format($summary['resolved'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Approved:</span>
                    <span class="summary-value">{{ number_format($summary['approved'] ?? 0) }}</span>
                </td>
                <td>
                    <span class="summary-label">Rejected:</span>
                    <span class="summary-value">{{ number_format($summary['rejected'] ?? 0) }}</span>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== DATA TABLE ==================== --}}
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-case">Case No.</th>
                <th class="col-complainant">Complainant</th>
                <th class="col-respondent">Respondent</th>
                <th class="col-incident-date">Incident Date</th>
                <th class="col-location">Location</th>
                <th class="col-nature">Nature / Description</th>
                <th class="col-status">Status</th>
                <th class="col-official">Assigned To</th>
                <th class="col-reported">Date Reported</th>
            </tr>
        </thead>
        <tbody>
            @forelse($blotters as $index => $blotter)
                @php
                    // Format complainant name as: LAST NAME, First Name
                    $complainantName = 'N/A';
                    $complainantInfo = '';
                    if ($blotter->complainant) {
                        $lastName = strtoupper($blotter->complainant->last_name ?? '');
                        $firstName = ucfirst(strtolower($blotter->complainant->first_name ?? ''));
                        $middleName = !empty($blotter->complainant->middle_name) 
                            ? ' ' . ucfirst(strtolower($blotter->complainant->middle_name)) 
                            : '';
                        $complainantName = $lastName . ', ' . $firstName . $middleName;
                        $complainantInfo = ($blotter->complainant->age ?? 'N/A') . ' yrs old';
                    } elseif ($blotter->complainant_full_name) {
                        $complainantName = strtoupper($blotter->complainant_full_name);
                        $complainantInfo = ($blotter->complainant_age ?? 'N/A') . ' yrs old (Non-Resident)';
                    }
                    
                    // Format respondent name as: LAST NAME, First Name
                    $respondentName = 'N/A';
                    $respondentInfo = '';
                    if ($blotter->respondent) {
                        $lastName = strtoupper($blotter->respondent->last_name ?? '');
                        $firstName = ucfirst(strtolower($blotter->respondent->first_name ?? ''));
                        $middleName = !empty($blotter->respondent->middle_name) 
                            ? ' ' . ucfirst(strtolower($blotter->respondent->middle_name)) 
                            : '';
                        $respondentName = $lastName . ', ' . $firstName . $middleName;
                        $respondentInfo = ($blotter->respondent->age ?? 'N/A') . ' yrs old';
                    } elseif ($blotter->respondent_full_name) {
                        $respondentName = strtoupper($blotter->respondent_full_name);
                        $respondentInfo = ($blotter->respondent_age ?? 'N/A') . ' yrs old (Non-Resident)';
                    }
                    
                    // Get location
                    $location = $blotter->incident_location ?? 'N/A';
                    if ($location === 'N/A' && $blotter->complainant && $blotter->complainant->household && $blotter->complainant->household->purok) {
                        $location = $blotter->complainant->household->purok->name;
                    }
                    
                    // Format dates
                    $incidentDate = $blotter->incident_date 
                        ? \Carbon\Carbon::parse($blotter->incident_date)->format('M d, Y')
                        : 'N/A';
                    
                    $reportedDate = $blotter->created_at 
                        ? \Carbon\Carbon::parse($blotter->created_at)->format('M d, Y')
                        : 'N/A';
                    
                    // Get nature/description (truncate if too long)
                    $nature = $blotter->description ?? 'N/A';
                    if (strlen($nature) > 80) {
                        $nature = substr($nature, 0, 80) . '...';
                    }
                    
                    // Get assigned official
                    $assignedTo = 'N/A';
                    if ($blotter->official) {
                        $assignedTo = $blotter->official->name;
                    }
                    
                    // Status class
                    $statusClass = 'status-pending';
                    $status = strtolower($blotter->status ?? 'pending');
                    if (in_array($status, ['resolved', 'settled', 'closed'])) {
                        $statusClass = 'status-resolved';
                    } elseif (in_array($status, ['ongoing', 'open', 'under_investigation'])) {
                        $statusClass = 'status-ongoing';
                    } elseif ($status === 'rejected') {
                        $statusClass = 'status-rejected';
                    }
                @endphp
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-case text-bold">{{ $blotter->case_number ?? 'N/A' }}</td>
                    <td class="col-complainant">
                        <div class="name-format">{{ $complainantName }}</div>
                        @if($complainantInfo)
                            <div class="sub-info">{{ $complainantInfo }}</div>
                        @endif
                    </td>
                    <td class="col-respondent">
                        <div class="name-format">{{ $respondentName }}</div>
                        @if($respondentInfo)
                            <div class="sub-info">{{ $respondentInfo }}</div>
                        @endif
                    </td>
                    <td class="col-incident-date">{{ $incidentDate }}</td>
                    <td class="col-location">{{ $location }}</td>
                    <td class="col-nature">{{ $nature }}</td>
                    <td class="col-status {{ $statusClass }}">
                        <strong>{{ ucfirst($blotter->status ?? 'Pending') }}</strong>
                    </td>
                    <td class="col-official">{{ $assignedTo }}</td>
                    <td class="col-reported">{{ $reportedDate }}</td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="10">No blotter/case records found matching the specified criteria.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Total Records Count --}}
    <div style="text-align: right; font-size: 9pt; margin-top: 10px; font-weight: bold;">
        Total Records: {{ $blotters->count() }}
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
        <div class="footer-text">Official Barangay Blotter/Case Records Report – System Generated</div>
        <div>Generated on {{ $generated_date ?? date('F d, Y') }} at {{ $generated_time ?? date('h:i A') }}</div>
    </div>
</body>
</html>
