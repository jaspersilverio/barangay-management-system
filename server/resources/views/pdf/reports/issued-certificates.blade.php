<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Issued Certificates Report' }}</title>
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

        /* ==================== HEADER ==================== */
        .page-header {
            width: 100%;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }

        .header-table {
            width: 100%;
            border: none;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }

        .header-left {
            width: 15%;
            text-align: center;
        }

        .header-center {
            width: 70%;
            text-align: center;
        }

        .header-right {
            width: 15%;
            text-align: right;
            font-size: 8pt;
            color: #333;
        }

        .header-logo {
            width: 70px;
            height: 70px;
        }

        .logo-placeholder {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background-color: #1a5276;
            line-height: 70px;
            text-align: center;
            color: white;
            font-size: 24pt;
            font-weight: bold;
            margin: 0 auto;
        }

        .header-text-row {
            font-size: 9pt;
            color: #333;
            margin: 1px 0;
        }

        .header-barangay {
            font-size: 14pt;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 3px 0;
        }

        .header-office {
            font-size: 10pt;
            font-weight: bold;
            margin-top: 3px;
        }

        /* ==================== TITLE SECTION ==================== */
        .title-section {
            text-align: center;
            margin: 15px 0;
            padding-bottom: 10px;
            border-bottom: 3px double #000;
        }

        .report-title {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .filter-info {
            font-size: 9pt;
            color: #333;
            margin-top: 8px;
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
        .col-cert-num { width: 12%; text-align: center; }
        .col-resident { width: 16%; text-align: left; }
        .col-type { width: 14%; text-align: left; }
        .col-purpose { width: 16%; text-align: left; }
        .col-valid-from { width: 9%; text-align: center; }
        .col-valid-until { width: 9%; text-align: center; }
        .col-status { width: 8%; text-align: center; }
        .col-issued-by { width: 12%; text-align: left; }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-uppercase { text-transform: uppercase; }
        .text-bold { font-weight: bold; }

        /* Status badges */
        .status-valid { color: #155724; }
        .status-expired { color: #856404; }
        .status-invalid { color: #721c24; }

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
    {{-- ==================== PAGE HEADER ==================== --}}
    <div class="page-header">
        <table class="header-table">
            <tr>
                <td class="header-left">
                    @php
                        $showLogo = false;
                        $logoSrc = null;
                        $gdAvailable = extension_loaded('gd');
                        
                        if ($gdAvailable && !empty($barangay_info['logo_base64'])) {
                            $showLogo = true;
                            $logoSrc = $barangay_info['logo_base64'];
                        }
                    @endphp
                    
                    @if ($showLogo && $logoSrc)
                        <img src="{{ $logoSrc }}" alt="Logo" class="header-logo">
                    @else
                        <div class="logo-placeholder">B</div>
                    @endif
                </td>
                <td class="header-center">
                    <div class="header-text-row">Republic of the Philippines</div>
                    <div class="header-text-row">{{ $barangay_info['province'] ?? 'Province' }}</div>
                    <div class="header-text-row">{{ $barangay_info['municipality'] ?? 'Municipality' }}</div>
                    <div class="header-barangay">{{ $barangay_info['name'] ?? 'Barangay' }}</div>
                    <div class="header-office">OFFICE OF THE PUNONG BARANGAY</div>
                </td>
                <td class="header-right">
                    <div><strong>Date:</strong> {{ $generated_date ?? date('F d, Y') }}</div>
                    <div><strong>Time:</strong> {{ $generated_time ?? date('h:i A') }}</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== TITLE SECTION ==================== --}}
    <div class="title-section">
        <div class="report-title">{{ $document_title ?? 'ISSUED CERTIFICATES MASTERLIST' }}</div>
        <div class="filter-info">
            <span><strong>Status:</strong> {{ $filters['status'] ?? 'All Status' }}</span>
            <span>|</span>
            <span><strong>Type:</strong> {{ $filters['certificate_type'] ?? 'All Types' }}</span>
            @if(isset($filters['search']) && $filters['search'])
                <span>|</span>
                <span><strong>Search:</strong> {{ $filters['search'] }}</span>
            @endif
        </div>
    </div>

    {{-- ==================== SUMMARY SECTION ==================== --}}
    <div class="summary-section">
        <div class="summary-title">Certificates Summary</div>
        <table class="summary-table">
            <tr>
                <td style="width: 20%;">
                    <span class="summary-label">Total Certificates:</span>
                    <span class="summary-value">{{ number_format($summary['total'] ?? 0) }}</span>
                </td>
                <td style="width: 20%;">
                    <span class="summary-label">Valid:</span>
                    <span class="summary-value" style="color: #155724;">{{ number_format($summary['valid'] ?? 0) }}</span>
                </td>
                <td style="width: 20%;">
                    <span class="summary-label">Expired:</span>
                    <span class="summary-value" style="color: #856404;">{{ number_format($summary['expired'] ?? 0) }}</span>
                </td>
                <td style="width: 20%;">
                    <span class="summary-label">Invalid:</span>
                    <span class="summary-value" style="color: #721c24;">{{ number_format($summary['invalid'] ?? 0) }}</span>
                </td>
                <td style="width: 20%;">
                    @if(isset($summary['by_type']) && count($summary['by_type']) > 0)
                        <span class="summary-label">By Type:</span>
                        @foreach($summary['by_type'] as $type => $count)
                            <span class="summary-value">{{ ucwords(str_replace('_', ' ', $type)) }}: {{ $count }}</span>
                        @endforeach
                    @endif
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== DATA TABLE ==================== --}}
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-cert-num">Certificate No.</th>
                <th class="col-resident">Resident Name</th>
                <th class="col-type">Certificate Type</th>
                <th class="col-purpose">Purpose</th>
                <th class="col-valid-from">Valid From</th>
                <th class="col-valid-until">Valid Until</th>
                <th class="col-status">Status</th>
                <th class="col-issued-by">Issued By</th>
            </tr>
        </thead>
        <tbody>
            @forelse($certificates as $index => $certificate)
                @php
                    // Format resident name as: LAST NAME, First Name
                    $residentName = 'N/A';
                    if ($certificate->resident) {
                        $lastName = strtoupper($certificate->resident->last_name ?? '');
                        $firstName = ucfirst(strtolower($certificate->resident->first_name ?? ''));
                        $middleName = !empty($certificate->resident->middle_name) 
                            ? ' ' . ucfirst(strtolower($certificate->resident->middle_name)) 
                            : '';
                        $residentName = $lastName . ', ' . $firstName . $middleName;
                    }
                    
                    // Format dates
                    $validFrom = $certificate->valid_from 
                        ? \Carbon\Carbon::parse($certificate->valid_from)->format('M d, Y')
                        : 'N/A';
                    
                    $validUntil = $certificate->valid_until 
                        ? \Carbon\Carbon::parse($certificate->valid_until)->format('M d, Y')
                        : 'N/A';
                    
                    // Get purpose (truncate if too long)
                    $purpose = $certificate->purpose ?? 'N/A';
                    if (strlen($purpose) > 50) {
                        $purpose = substr($purpose, 0, 50) . '...';
                    }
                    
                    // Get issued by
                    $issuedBy = 'N/A';
                    if ($certificate->issuedBy) {
                        $issuedBy = $certificate->issuedBy->name;
                    }
                    
                    // Determine status
                    $status = 'Valid';
                    $statusClass = 'status-valid';
                    if (!$certificate->is_valid) {
                        $status = 'Invalid';
                        $statusClass = 'status-invalid';
                    } elseif ($certificate->valid_until < now()) {
                        $status = 'Expired';
                        $statusClass = 'status-expired';
                    }
                    
                    // Certificate type label
                    $typeLabel = ucwords(str_replace('_', ' ', $certificate->certificate_type));
                @endphp
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-cert-num text-bold">{{ $certificate->certificate_number ?? 'N/A' }}</td>
                    <td class="col-resident text-bold">{{ $residentName }}</td>
                    <td class="col-type">{{ $typeLabel }}</td>
                    <td class="col-purpose">{{ $purpose }}</td>
                    <td class="col-valid-from">{{ $validFrom }}</td>
                    <td class="col-valid-until">{{ $validUntil }}</td>
                    <td class="col-status {{ $statusClass }}">
                        <strong>{{ $status }}</strong>
                    </td>
                    <td class="col-issued-by">{{ $issuedBy }}</td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="9">No issued certificates found matching the specified criteria.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Total Records Count --}}
    <div style="text-align: right; font-size: 9pt; margin-top: 10px; font-weight: bold;">
        Total Records: {{ $certificates->count() }}
    </div>

    {{-- ==================== SIGNATURE SECTION ==================== --}}
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
                        <div class="signature-line" style="margin-left: auto;"></div>
                        <div class="signature-name">{{ $noted_by['name'] ?? 'BARANGAY CAPTAIN' }}</div>
                        <div class="signature-position">{{ $noted_by['position'] ?? 'Punong Barangay' }}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ==================== FOOTER ==================== --}}
    <div class="page-footer">
        <div class="footer-text">Official Barangay Issued Certificates Report – System Generated</div>
        <div>Generated on {{ $generated_date ?? date('F d, Y') }} at {{ $generated_time ?? date('h:i A') }}</div>
    </div>
</body>
</html>
