@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <div style="margin-bottom: 20px;">
            <div style="font-size: 10pt; color: #666; margin-bottom: 10px;">
                <strong>Filters Applied:</strong><br>
                Status: {{ $filters['status'] ?? 'All' }}<br>
                Date Range: {{ $filters['date_range'] ?? 'All dates' }}<br>
                @if(isset($filters['search']) && $filters['search'])
                    Search: {{ $filters['search'] }}<br>
                @endif
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">Case #</th>
                    <th style="width: 18%;">Complainant</th>
                    <th style="width: 18%;">Respondent</th>
                    <th style="width: 10%;">Incident Date</th>
                    <th style="width: 12%;">Location/Purok</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 12%;">Nature</th>
                    <th style="width: 12%;">Date Reported</th>
                </tr>
            </thead>
            <tbody>
                @forelse($blotters as $blotter)
                    <tr>
                        <td>{{ $blotter->case_number }}</td>
                        <td>
                            @if($blotter->complainant)
                                {{ $blotter->complainant->full_name }}
                            @else
                                {{ $blotter->complainant_full_name ?? 'N/A' }}
                            @endif
                        </td>
                        <td>
                            @if($blotter->respondent)
                                {{ $blotter->respondent->full_name }}
                            @else
                                {{ $blotter->respondent_full_name ?? 'N/A' }}
                            @endif
                        </td>
                        <td>
                            @if($blotter->incident_date)
                                {{ \Carbon\Carbon::parse($blotter->incident_date)->format('M d, Y') }}
                            @else
                                N/A
                            @endif
                        </td>
                        <td>
                            @php
                                $purokName = 'N/A';
                                if ($blotter->complainant && $blotter->complainant->household && $blotter->complainant->household->purok) {
                                    $purokName = $blotter->complainant->household->purok->name;
                                }
                                $location = $blotter->incident_location ?? 'N/A';
                                $locationDisplay = $location !== 'N/A' ? $location : ($purokName !== 'N/A' ? $purokName : 'N/A');
                            @endphp
                            {{ $locationDisplay }}
                        </td>
                        <td>{{ ucfirst($blotter->status ?? 'Open') }}</td>
                        <td>
                            @php
                                $nature = 'N/A';
                                if ($blotter->description) {
                                    $nature = strlen($blotter->description) > 30 
                                        ? substr($blotter->description, 0, 30) . '...' 
                                        : $blotter->description;
                                }
                            @endphp
                            {{ $nature }}
                        </td>
                        <td>
                            @if($blotter->created_at)
                                {{ \Carbon\Carbon::parse($blotter->created_at)->format('M d, Y') }}
                            @else
                                N/A
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 20px;">
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

