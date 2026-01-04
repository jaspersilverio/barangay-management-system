@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <div style="margin-bottom: 20px;">
            <div style="font-size: 10pt; color: #666; margin-bottom: 10px;">
                <strong>Filters Applied:</strong><br>
                Status: {{ $filters['status'] ?? 'All' }}<br>
                Date Range: {{ $filters['date_range'] ?? 'All dates' }}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">Case #</th>
                    <th style="width: 20%;">Complainant</th>
                    <th style="width: 20%;">Respondent</th>
                    <th style="width: 12%;">Incident Date</th>
                    <th style="width: 15%;">Location</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 15%;">Nature</th>
                </tr>
            </thead>
            <tbody>
                @forelse($blotters as $blotter)
                    <tr>
                        <td>{{ $blotter->case_number }}</td>
                        <td>{{ $blotter->complainant ? $blotter->complainant->full_name : $blotter->complainant_name }}</td>
                        <td>{{ $blotter->respondent ? $blotter->respondent->full_name : $blotter->respondent_name }}</td>
                        <td>{{ \Carbon\Carbon::parse($blotter->incident_date)->format('M d, Y') }}</td>
                        <td>{{ $blotter->incident_location ?? 'N/A' }}</td>
                        <td>{{ ucfirst($blotter->status ?? 'Pending') }}</td>
                        <td>{{ $blotter->nature_of_complaint ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px;">
                            No blotter entries found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 10pt; color: #666;">
            <strong>Total Records:</strong> {{ $blotters->count() }}
        </div>
    </div>
@endsection

