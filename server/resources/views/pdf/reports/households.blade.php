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
                    <th style="width: 25%;">Head of Household</th>
                    <th style="width: 15%;">Purok</th>
                    <th style="width: 20%;">Address</th>
                    <th style="width: 10%;">Members</th>
                    <th style="width: 15%;">Contact</th>
                    <th style="width: 10%;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($households as $index => $household)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $household->head_name }}</td>
                        <td>{{ $household->purok->name ?? 'N/A' }}</td>
                        <td>{{ $household->address ?? 'N/A' }}</td>
                        <td>{{ $household->members_count ?? 0 }}</td>
                        <td>{{ $household->contact_number ?? 'N/A' }}</td>
                        <td>{{ ucfirst($household->status ?? 'Active') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px;">
                            No households found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 10pt; color: #666;">
            <strong>Total Records:</strong> {{ $households->count() }}
        </div>
    </div>
@endsection
