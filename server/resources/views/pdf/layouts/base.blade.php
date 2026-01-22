<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Document' }}</title>
    <style>
        @page {
            margin: {{ $margin_top ?? 20 }}mm {{ $margin_right ?? 15 }}mm {{ $margin_bottom ?? 20 }}mm {{ $margin_left ?? 15 }}mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }

        /* Header Styles */
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #1a1a1a;
        }

        .header-logo {
            width: 70px;
            height: 70px;
            margin: 0 auto 10px;
            display: block;
        }

        .header-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 5px 0;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .header-subtitle {
            font-size: 11pt;
            color: #555;
            margin: 3px 0;
        }

        .header-contact {
            font-size: 10pt;
            color: #666;
            margin-top: 5px;
        }

        /* Content Styles */
        .content {
            margin: 20px 0;
        }

        .document-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin: 25px 0 20px;
            color: #1a1a1a;
            text-transform: uppercase;
        }

        .section {
            margin: 20px 0;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1a1a1a;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }

        table thead {
            background-color: #f5f5f5;
        }

        table th {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
            color: #1a1a1a;
        }

        table td {
            padding: 6px 8px;
            border: 1px solid #ddd;
        }

        table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 40px;
            text-align: right;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 250px;
            margin: 10px 0 5px auto;
            display: block;
        }

        .signature-name {
            font-weight: bold;
            margin-top: 5px;
        }

        .signature-position {
            font-size: 10pt;
            color: #555;
        }

        /* Footer Styles */
        .footer {
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }

        .footer-info {
            margin: 3px 0;
        }

        .page-number {
            margin-top: 10px;
            font-size: 9pt;
            color: #888;
        }

        /* Utility Classes */
        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-bold {
            font-weight: bold;
        }

        .mb-1 {
            margin-bottom: 5px;
        }

        .mb-2 {
            margin-bottom: 10px;
        }

        .mb-3 {
            margin-bottom: 15px;
        }

        .mb-4 {
            margin-bottom: 20px;
        }

        .mt-1 {
            margin-top: 5px;
        }

        .mt-2 {
            margin-top: 10px;
        }

        .mt-3 {
            margin-top: 15px;
        }

        .mt-4 {
            margin-top: 20px;
        }

        /* Print-specific styles */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>
    <!-- Header -->
    <div class="header">
        @if (!empty($barangay_info['logo_path']) && Storage::disk('public')->exists($barangay_info['logo_path']))
            <img src="{{ Storage::disk('public')->url($barangay_info['logo_path']) }}" alt="Logo" class="header-logo">
        @else
            <div
                style="width: 70px; height: 70px; margin: 0 auto 10px; background-color: #f0f0f0; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 24pt;">
                🏘️</div>
        @endif
        <div class="header-title">{{ $barangay_info['name'] ?? 'Barangay' }}</div>
        <div class="header-subtitle">
            @if(!empty($barangay_info['province']) && !empty($barangay_info['municipality']))
                {{ $barangay_info['municipality'] }}, {{ $barangay_info['province'] }}
            @else
                {{ $barangay_info['address'] ?? 'Municipality, Province' }}
            @endif
        </div>
        @if (!empty($barangay_info['contact']))
            <div class="header-contact">Contact: {{ $barangay_info['contact'] }}</div>
        @endif
        @if (!empty($barangay_info['slogan']))
            <div class="header-contact" style="font-style: italic; margin-top: 3px;">{{ $barangay_info['slogan'] }}</div>
        @endif
    </div>

    <!-- Content -->
    <div class="content">
        @if (isset($document_title))
            <div class="document-title">{{ $document_title }}</div>
        @endif

        @yield('content')
    </div>

    <!-- Footer -->
    <div class="footer" style="position: fixed; bottom: 0; left: 0; right: 0; margin-top: 30px;">
        <div class="footer-info">Generated by Barangay Management System</div>
        <div class="footer-info">Generated on: {{ $generated_date ?? date('F d, Y') }} at
            {{ $generated_time ?? date('h:i A') }}</div>
    </div>
</body>

</html>
