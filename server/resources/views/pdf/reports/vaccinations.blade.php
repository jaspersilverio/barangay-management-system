@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <div style="margin-bottom: 20px;">
            <div style="font-size: 10pt; color: #666; margin-bottom: 10px;">
                <strong>Filters Applied:</strong><br>
                Purok: {{ $filters['purok'] ?? 'All' }}<br>
                Status: {{ $filters['status'] ?? 'All' }}<br>
                Vaccine: {{ $filters['vaccine'] ?? 'All' }}<br>
                Date Range: {{ $filters['date_range'] ?? 'All dates' }}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 20%;">Resident Name</th>
                    <th style="width: 12%;">Purok</th>
                    <th style="width: 10%;">Age/Sex</th>
                    <th style="width: 18%;">Vaccine Name</th>
                    <th style="width: 10%;">Dose</th>
                    <th style="width: 12%;">Date Administered</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 3%;">Administered By</th>
                </tr>
            </thead>
            <tbody>
                @forelse($vaccinations as $index => $vaccination)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            @if($vaccination->resident)
                                {{ $vaccination->resident->full_name ?? ($vaccination->resident->first_name . ' ' . $vaccination->resident->last_name) }}
                            @else
                                N/A
                            @endif
                        </td>
                        <td>
                            @if($vaccination->resident && $vaccination->resident->household && $vaccination->resident->household->purok)
                                {{ $vaccination->resident->household->purok->name }}
                            @else
                                N/A
                            @endif
                        </td>
                        <td>
                            @if($vaccination->resident)
                                {{ $vaccination->resident->age ?? 'N/A' }}
                                / {{ ucfirst($vaccination->resident->sex ?? 'N/A') }}
                            @else
                                N/A / N/A
                            @endif
                        </td>
                        <td>{{ $vaccination->vaccine_name ?? 'N/A' }}</td>
                        <td>{{ $vaccination->dose_number ?? 'N/A' }}</td>
                        <td>
                            @if($vaccination->date_administered)
                                {{ \Carbon\Carbon::parse($vaccination->date_administered)->format('M d, Y') }}
                            @else
                                N/A
                            @endif
                        </td>
                        <td>{{ ucfirst($vaccination->status ?? 'N/A') }}</td>
                        <td>{{ $vaccination->administered_by ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 20px;">
                            No vaccination records found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 10pt; color: #666;">
            <strong>Total Records:</strong> {{ $vaccinations->count() }}
        </div>
    </div>
@endsection
