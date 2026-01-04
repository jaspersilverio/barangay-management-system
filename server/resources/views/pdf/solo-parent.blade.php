<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Solo Parent Certificate</title>
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
            line-height: 1.8;
        }

        .resident-info {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }

        .info-row {
            margin: 10px 0;
            display: flex;
        }

        .info-label {
            font-weight: bold;
            width: 200px;
        }

        .info-value {
            flex: 1;
        }

        .certificate-body {
            text-align: justify;
            margin: 30px 0;
            font-size: 14px;
        }

        .footer {
            margin-top: 50px;
            text-align: right;
        }

        .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            text-align: center;
            width: 45%;
        }

        .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 5px;
        }

        .certificate-number {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="title">REPUBLIC OF THE PHILIPPINES</div>
        <div class="subtitle">{{ $barangay_info['name'] ?? 'Barangay' }}</div>
        <div class="subtitle">{{ $barangay_info['address'] ?? 'Municipality, Province' }}</div>
        @if(!empty($barangay_info['contact']))
            <div class="subtitle">{{ $barangay_info['contact'] }}</div>
        @endif
    </div>

    <div class="certificate-number">
        Certificate No: SP-{{ str_pad($solo_parent->id, 6, '0', STR_PAD_LEFT) }}
    </div>

    <div class="content">
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; margin: 20px 0;">CERTIFICATE OF SOLO PARENT</h2>
        </div>

        <div class="certificate-body">
            <p>
                TO WHOM IT MAY CONCERN:
            </p>

            <p style="text-indent: 50px; margin-top: 20px;">
                This is to certify that <strong>{{ $resident->first_name }} {{ $resident->middle_name ?? '' }}
                    {{ $resident->last_name }}</strong>,
                {{ $resident->age ?? 'N/A' }} years old,
                {{ strtolower($resident->sex) === 'male' ? 'male' : 'female' }},
                {{ strtolower($resident->civil_status) }}, a resident of
                {{ $resident->household->address ?? 'this barangay' }},
                {{ $barangay_info['name'] ?? 'this barangay' }}, is a <strong>SOLO PARENT</strong> as defined under Republic Act No. 8972 (Solo
                Parents' Welfare Act of 2000).
            </p>

            <p style="text-indent: 50px; margin-top: 20px;">
                The above-named person is qualified as a solo parent due to:
                <strong>{{ $solo_parent->eligibility_reason_label }}</strong>.
            </p>

            @if ($dependent_children && $dependent_children->count() > 0)
                <p style="text-indent: 50px; margin-top: 20px;">
                    The solo parent has the following dependent children:
                </p>
                <ul style="margin-left: 100px; margin-top: 10px;">
                    @foreach ($dependent_children as $child)
                        <li>{{ $child->first_name }} {{ $child->middle_name ?? '' }} {{ $child->last_name }},
                            {{ $child->age ?? 'N/A' }} years old, {{ $child->relationship_to_head }}</li>
                    @endforeach
                </ul>
            @endif

            <p style="text-indent: 50px; margin-top: 20px;">
                This certificate was issued on <strong>{{ $date_declared_formatted }}</strong> and is valid until
                <strong>{{ $valid_until_formatted }}</strong>.
            </p>

            <p style="text-indent: 50px; margin-top: 20px;">
                This certificate is issued upon the request of the above-named person for whatever legal purpose it may
                serve.
            </p>

            <p style="text-indent: 50px; margin-top: 20px;">
                Issued this <strong>{{ $generated_date ?? $current_date ?? date('F d, Y') }}</strong> at {{ $barangay_info['name'] ?? 'this barangay' }}, {{ $barangay_info['address'] ?? 'Municipality, Province' }}.
            </p>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    <div style="margin-top: 5px; font-weight: bold;">Barangay Captain</div>
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    <div style="margin-top: 5px; font-weight: bold;">Barangay Secretary</div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>
