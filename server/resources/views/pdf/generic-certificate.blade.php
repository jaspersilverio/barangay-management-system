<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $certificate->certificate_type_label }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }

        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
            display: block;
        }

        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
            color: #333;
        }

        .subtitle {
            font-size: 16px;
            color: #666;
            margin: 5px 0;
        }

        .content {
            margin: 30px 0;
            line-height: 1.6;
        }

        .resident-info {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }

        .signature-section {
            margin-top: 50px;
            text-align: right;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 10px 0;
            display: inline-block;
        }

        .certificate-number {
            text-align: center;
            font-size: 14px;
            color: #666;
            margin: 20px 0;
        }

        .qr-code {
            text-align: center;
            margin: 20px 0;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo">🏘️</div>
        <div class="title">{{ $barangay_name }}</div>
        <div class="subtitle">{{ $barangay_address }}</div>
        <div class="subtitle">Contact: {{ $barangay_contact }}</div>
    </div>

    <div class="certificate-number">
        <strong>Certificate Number:</strong> {{ $certificate->certificate_number }}
    </div>

    <div class="content">
        <h2 style="text-align: center; color: #333;">{{ strtoupper($certificate->certificate_type_label) }}</h2>

        <p>TO WHOM IT MAY CONCERN:</p>

        <p>This is to certify that <strong>{{ $resident->full_name }}</strong>,
            of legal age, Filipino, and a resident of {{ $barangay_name }},
            has requested for a {{ $certificate->certificate_type_label }}.</p>

        <div class="resident-info">
            <strong>Resident Information:</strong><br>
            Name: {{ $resident->full_name }}<br>
            Address: {{ $resident->address ?? 'Not specified' }}<br>
            Contact: {{ $resident->contact_number ?? 'Not specified' }}
        </div>

        <p>This certification is being issued upon the request of the above-named person
            for <strong>{{ $certificate->purpose }}</strong>.</p>

        <p>This certificate is valid from <strong>{{ $valid_from_formatted }}</strong>
            to <strong>{{ $valid_until_formatted }}</strong>.</p>

        <p>Issued this <strong>{{ $issued_date_formatted }}</strong> at {{ $barangay_name }}.</p>
    </div>

    <div class="signature-section">
        <div class="signature-line"></div>
        <div><strong>{{ $certificate->signed_by }}</strong></div>
        <div>{{ $certificate->signature_position }}</div>
    </div>

    <div class="qr-code">
        <p><strong>QR Code:</strong> {{ $qr_code_data }}</p>
    </div>

    <div class="footer">
        <p>This document is computer-generated and does not require a wet signature.</p>
        <p>For verification, please scan the QR code or contact the barangay office.</p>
    </div>
</body>

</html>
