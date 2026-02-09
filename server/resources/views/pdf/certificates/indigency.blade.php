@extends('pdf.layouts.base')

@section('styles')
    <style>
        .indigency-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }

        .indigency-table td {
            vertical-align: top;
            padding: 0;
        }

        .indigency-left {
            width: 28%;
            padding-right: 10px;
        }

        .indigency-right {
            width: 72%;
            padding-left: 12px;
        }

        .council-title {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .council-item {
            margin-bottom: 12px;
        }

        .council-name {
            font-weight: bold;
            font-size: 10pt;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .council-position {
            font-size: 10pt;
            color: #333;
        }

        .office-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin: 8px 0 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
    </style>
@endsection

@section('content')
    <table class="indigency-table">
        <tr>
            <td class="indigency-left">
                <div class="council-title">Barangay {{ $barangay_info['name'] ?? 'Barangay' }} Council:</div>
                @foreach ($council_list ?? [] as $item)
                    <div class="council-item">
                        <div class="council-name">{{ $item['name'] }}</div>
                        <div class="council-position">{{ $item['position'] }}</div>
                    </div>
                @endforeach
            </td>
            <td class="indigency-right">
                <div class="office-title">Office of the Punong Barangay</div>

                <p class="greeting">TO WHOM IT MAY CONCERN:</p>

                <p class="body-text">
                    This is to certify that <strong>{{ strtoupper($resident->full_name) }}</strong>,
                    @if ($resident->age)
                        <strong>{{ $resident->age }}</strong> years of age,
                    @else
                        of legal age,
                    @endif
                    @if ($resident->civil_status)
                        {{ strtolower($resident->civil_status) }}
                    @else
                        single
                    @endif
                    and a bona fide resident of {{ $barangay_info['name'] ?? '' }}
                    @if (!empty($barangay_info['municipality']))
                        , {{ $barangay_info['municipality'] }}
                    @endif
                    @if (!empty($barangay_info['province']))
                        , {{ $barangay_info['province'] }}
                    @endif
                    , belongs to indigent family.
                </p>

                <p class="body-text">
                    This certification is being issued for whatever legal purposes it may serve her/his best.
                </p>

                @php
                    $issueDate = $certificate->created_at ? \Carbon\Carbon::parse($certificate->created_at) : now();
                    $dayOrdinal = $issueDate->format('jS');
                    $monthYear = $issueDate->format('F, Y');
                @endphp
                <p class="issue-statement">
                    Given this <strong>{{ $dayOrdinal }}</strong> day of <strong>{{ $monthYear }}</strong>, at
                    Barangay {{ $barangay_info['name'] ?? '' }},
                    @if (!empty($barangay_info['municipality']))
                        {{ $barangay_info['municipality'] }},
                    @endif
                    @if (!empty($barangay_info['province']))
                        {{ $barangay_info['province'] }}
                    @endif
                    .
                </p>

                @include('pdf.certificates.partials.signatures')
            </td>
        </tr>
    </table>
@endsection
