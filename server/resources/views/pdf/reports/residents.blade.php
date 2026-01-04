@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <div style="margin-bottom: 20px;">
            <div style="font-size: 10pt; color: #666; margin-bottom: 10px;">
                <strong>Filters Applied:</strong><br>
                Purok: {{ $filters['purok'] ?? 'All' }}<br>
                Search: {{ $filters['search'] ?? 'None' }}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 25%;">Name</th>
                    <th style="width: 15%;">Purok</th>
                    <th style="width: 20%;">Household</th>
                    <th style="width: 8%;">Sex</th>
                    <th style="width: 12%;">Civil Status</th>
                    <th style="width: 8%;">Age</th>
                    <th style="width: 7%;">Occupation</th>
                </tr>
            </thead>
            <tbody>
                @forelse($residents as $index => $resident)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $resident->full_name }}</td>
                        <td>{{ $resident->household->purok->name ?? 'N/A' }}</td>
                        <td>{{ $resident->household->head_name ?? 'N/A' }}</td>
                        <td>{{ ucfirst($resident->sex ?? 'N/A') }}</td>
                        <td>{{ ucfirst($resident->civil_status ?? 'N/A') }}</td>
                        <td>{{ $resident->age ?? 'N/A' }}</td>
                        <td>{{ $resident->occupation ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 20px;">
                            No residents found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 10pt; color: #666;">
            <strong>Total Records:</strong> {{ $residents->count() }}
        </div>
    </div>
@endsection

