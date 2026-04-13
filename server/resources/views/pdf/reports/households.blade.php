@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <div class="section-title">SECTION 1 – Household Summary</div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">No.</th>
                    <th style="width: 10%;">Household ID</th>
                    <th style="width: 20%;">Head of Household</th>
                    <th style="width: 12%;">Purok</th>
                    <th style="width: 23%;">Complete Address</th>
                    <th style="width: 8%;">Members</th>
                    <th style="width: 12%;">Date Registered</th>
                    <th style="width: 10%;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($households as $index => $household)
                    <tr>
                        <td style="text-align: center;">{{ $index + 1 }}</td>
                        <td style="text-align: center;">{{ $household->id }}</td>
                        <td>
                            {{ $household->head_name
                                ?? ($household->headResident
                                    ? ($household->headResident->full_name ?? trim(($household->headResident->last_name ?? '') . ', ' . ($household->headResident->first_name ?? '')) )
                                    : 'N/A') }}
                        </td>
                        <td>{{ $household->purok->name ?? 'N/A' }}</td>
                        <td>{{ $household->address ?? 'N/A' }}</td>
                        <td style="text-align: center;">{{ $household->residents->count() ?? 0 }}</td>
                        <td style="text-align: center;">
                            {{ $household->created_at ? \Carbon\Carbon::parse($household->created_at)->format('M d, Y') : 'N/A' }}
                        </td>
                        <td style="text-align: center;">Active</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 20px;">
                            No households found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        @if (!empty($records_limited) && !empty($total_records))
            <div style="margin-top: 10px; font-size: 9pt; color: #666;">
                Showing first {{ $records_limit ?? 100 }} of {{ number_format($total_records) }} records. Apply filters to
                narrow results.
            </div>
        @endif
    </div>

@endsection

