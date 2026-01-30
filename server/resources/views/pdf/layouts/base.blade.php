<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Document' }}</title>
    <style>
        @page {
            margin: {{ $margin_top ?? 10 }}mm {{ $margin_right ?? 10 }}mm {{ $margin_bottom ?? 10 }}mm {{ $margin_left ?? 10 }}mm;
            size: {{ $paper ?? 'A4' }} {{ $orientation ?? 'portrait' }};
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
        }

        /* ==================== CERTIFICATE-SPECIFIC STYLES ==================== */
        .certificate-container {
            position: relative;
            padding: 8mm 12mm 25mm 12mm; /* top right bottom left - extra bottom for footer */
        }

        /* Decorative Border */
        .certificate-border {
            position: fixed;
            top: 5mm;
            left: 5mm;
            right: 5mm;
            bottom: 5mm;
            border: 3px solid #1a5276;
            pointer-events: none;
        }

        .certificate-border-inner {
            position: fixed;
            top: 8mm;
            left: 8mm;
            right: 8mm;
            bottom: 8mm;
            border: 1px solid #1a5276;
            pointer-events: none;
        }

        /* Header Section */
        .certificate-header {
            text-align: center;
            margin-top: 0;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        /* Logo Styles - At the very top */
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

        /* Government Hierarchy Text */
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

        .contact-header {
            font-size: 9pt;
            color: #444;
            margin-top: 3px;
        }

        /* Header Separator Line */
        .header-separator {
            border: none;
            border-top: 1px solid #333;
            margin: 12px auto 15px auto;
            width: 100%;
        }

        /* Document Title */
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

        /* Certificate Number */
        .certificate-number {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 10px;
            color: #333;
        }

        /* Content Section */
        .content {
            margin: 0;
            padding: 0;
        }

        .section {
            margin: 15px 0;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 8px;
            color: #1a1a1a;
            text-transform: uppercase;
        }

        /* Body Text */
        .body-text {
            text-align: justify;
            text-indent: 40px;
            margin: 8px 0;
            font-size: 11pt;
            line-height: 1.6;
        }

        .greeting {
            font-weight: bold;
            margin: 10px 0 8px;
            font-size: 11pt;
        }

        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11pt;
        }

        table thead {
            background-color: #f0f0f0;
        }

        table th {
            padding: 10px 8px;
            text-align: left;
            border: 1px solid #ccc;
            font-weight: bold;
        }

        table td {
            padding: 8px;
            border: 1px solid #ccc;
        }

        table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* Info Box */
        .info-box {
            margin: 10px 0;
            padding: 8px 12px;
            border: 1px solid #ccc;
            background-color: #fafafa;
            font-size: 10pt;
        }

        .info-box table {
            margin: 0;
            font-size: 10pt;
        }

        .info-box table td {
            border: none;
            padding: 3px 8px;
            vertical-align: top;
        }

        .info-label {
            font-weight: bold;
            width: 30%;
            color: #333;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 15px;
            text-align: right;
            padding-right: 15px;
        }

        .signature-block {
            display: inline-block;
            text-align: center;
            min-width: 200px;
        }

        .signature-image {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 3px;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 180px;
            margin: 0 auto 3px;
        }

        .signature-name {
            font-weight: bold;
            font-size: 11pt;
            text-transform: uppercase;
            margin-top: 3px;
        }

        .signature-position {
            font-size: 10pt;
            font-style: italic;
            color: #333;
        }

        /* Additional Signatories */
        .additional-signatures {
            margin-top: 20px;
        }

        .signatures-row {
            width: 100%;
        }

        .signatures-row td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 10px;
            border: none;
        }

        .attested-section {
            margin-top: 10px;
            text-align: left;
        }

        .attested-label {
            font-size: 9pt;
            margin-bottom: 8px;
        }

        /* Footer */
        .certificate-footer {
            position: fixed;
            bottom: 12mm;
            left: 12mm;
            right: 12mm;
            text-align: center;
            font-size: 8pt;
            color: #555;
            border-top: 1px solid #ddd;
            padding-top: 5px;
        }

        .footer-note {
            font-size: 7pt;
            font-style: italic;
            color: #666;
            margin-top: 3px;
        }

        /* Validity Box */
        .validity-box {
            margin: 20px 0;
            margin-left: auto;
            width: 55%;
            padding: 10px 15px;
            border: 1px solid #999;
            background-color: #fafafa;
            font-size: 10pt;
        }

        /* Purpose Statement */
        .purpose-statement {
            text-align: justify;
            text-indent: 40px;
            margin: 8px 0;
            font-size: 11pt;
            line-height: 1.6;
        }

        /* Issue Date */
        .issue-statement {
            text-align: justify;
            text-indent: 40px;
            margin: 10px 0;
            font-size: 11pt;
            line-height: 1.6;
        }

        /* Verification Code */
        .verification-section {
            margin-top: 10px;
            text-align: center;
            font-size: 8pt;
            color: #555;
        }

        .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 8pt;
            background-color: #f5f5f5;
            padding: 3px 8px;
            border: 1px solid #ddd;
            display: inline-block;
            max-width: 100%;
            word-break: break-all;
            overflow-wrap: break-word;
        }

        /* Utility Classes */
        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-justify {
            text-align: justify;
        }

        .text-bold {
            font-weight: bold;
        }

        .text-uppercase {
            text-transform: uppercase;
        }

        .text-capitalize {
            text-transform: capitalize;
        }

        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .mb-3 { margin-bottom: 15px; }
        .mb-4 { margin-bottom: 20px; }
        .mt-1 { margin-top: 5px; }
        .mt-2 { margin-top: 10px; }
        .mt-3 { margin-top: 15px; }
        .mt-4 { margin-top: 20px; }

        /* ==================== REPORT-SPECIFIC STYLES ==================== */
        /* Page Header for Reports */
        .page-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1a5276;
        }

        .header-table {
            width: 100%;
            border: none;
            border-collapse: collapse;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }

        .header-left {
            width: 80px;
            text-align: center;
        }

        .header-center {
            text-align: center;
            padding: 0 15px;
        }

        .header-right {
            width: 120px;
            text-align: right;
            font-size: 9pt;
            color: #666;
        }

        /* Report Footer */
        .report-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #666;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }

        /* Print Styles */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
    @yield('styles')
</head>

<body>
    @php
        $isCertificate = isset($is_certificate) && $is_certificate;
        $gdAvailable = extension_loaded('gd');
        $showLogo = false;
        $logoSrc = null;
        
        // Only show logo if GD is available AND we have a valid base64 image
        // DomPDF requires GD to render PNG/JPEG images
        if ($gdAvailable && !empty($barangay_info['logo_base64']) && str_starts_with($barangay_info['logo_base64'], 'data:')) {
            $showLogo = true;
            $logoSrc = $barangay_info['logo_base64'];
        }
    @endphp

    @if($isCertificate)
        {{-- CERTIFICATE LAYOUT --}}
        <div class="certificate-border"></div>
        <div class="certificate-border-inner"></div>
        
        <div class="certificate-container">
            {{-- Header --}}
            <div class="certificate-header">
                {{-- Logo at the very top --}}
                <div class="header-logo-container">
                    @if($showLogo && $logoSrc)
                        <img src="{{ $logoSrc }}" alt="Barangay Seal" class="header-logo">
                    @else
                        <div class="logo-placeholder">B</div>
                    @endif
                </div>
                
                {{-- Government Hierarchy Text (centered) --}}
                <div class="gov-header">Republic of the Philippines</div>
                <div class="location-header">
                    @if(!empty($barangay_info['province']))
                        Province of {{ $barangay_info['province'] }}
                    @endif
                </div>
                <div class="location-header">
                    @if(!empty($barangay_info['municipality']))
                        Municipality of {{ $barangay_info['municipality'] }}
                    @endif
                </div>
                <div class="brgy-header">Barangay {{ $barangay_info['name'] ?? 'Barangay' }}</div>
                
                {{-- Horizontal separator line --}}
                <hr class="header-separator">
            </div>

            {{-- Content --}}
            <div class="content">
                @if(isset($document_title))
                    <div class="document-title">{{ $document_title }}</div>
                @endif

                @yield('content')
            </div>

            {{-- Footer --}}
            <div class="certificate-footer">
                <div>NOT VALID WITHOUT OFFICIAL DRY SEAL</div>
                <div class="footer-note">This document is system-generated. Verify authenticity at the Barangay Hall.</div>
            </div>
        </div>
    @else
        {{-- REPORT LAYOUT --}}
        <div class="page-header">
            <table class="header-table">
                <tr>
                    <td class="header-left">
                        @if($showLogo && $logoSrc)
                            <img src="{{ $logoSrc }}" alt="Logo" style="width: 70px; height: 70px;">
                        @else
                            <div style="width: 70px; height: 70px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, #1a5276, #2874a6); line-height: 70px; text-align: center; color: white; font-size: 28pt; font-weight: bold;">B</div>
                        @endif
                    </td>
                    <td class="header-center">
                        <div style="font-size: 10pt;">Republic of the Philippines</div>
                        @if(!empty($barangay_info['province']))
                            <div style="font-size: 10pt;">Province of {{ $barangay_info['province'] }}</div>
                        @endif
                        @if(!empty($barangay_info['municipality']))
                            <div style="font-size: 10pt;">Municipality of {{ $barangay_info['municipality'] }}</div>
                        @endif
                        <div style="font-size: 14pt; font-weight: bold; margin-top: 5px; text-transform: uppercase;">
                            Barangay {{ $barangay_info['name'] ?? 'Barangay' }}
                        </div>
                        @if(!empty($barangay_info['address']))
                            <div style="font-size: 9pt; color: #555;">{{ $barangay_info['address'] }}</div>
                        @endif
                    </td>
                    <td class="header-right">
                        <div>{{ $generated_date ?? date('F d, Y') }}</div>
                        <div>{{ $generated_time ?? date('h:i A') }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="content">
            @if(isset($document_title))
                <div class="document-title" style="text-decoration: none; margin: 15px 0;">{{ $document_title }}</div>
            @endif

            @yield('content')
        </div>

        <div class="report-footer">
            <div>Generated by Barangay Management System</div>
            <div>{{ $generated_date ?? date('F d, Y') }} at {{ $generated_time ?? date('h:i A') }}</div>
        </div>
    @endif
</body>

</html>
