@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <div style="margin-bottom: 20px;">
            <div style="font-size: 10pt; color: #666; margin-bottom: 10px;">
                <strong>Filters Applied:</strong><br>
                Purok: {{ $filters['purok'] ?? 'All' }}<br>
                Search: {{ $filters['search'] ?? 'None' }}<br>
                Status: {{ $filters['status'] ?? 'All' }}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 20%;">Name</th>
                    <th style="width: 15%;">Purok</th>
                    <th style="width: 15%;">Household</th>
                    <th style="width: 15%;">Eligibility Reason</th>
                    <th style="width: 12%;">Date Declared</th>
                    <th style="width: 10%;">Valid Until</th>
                    <th style="width: 8%;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($solo_parents as $index => $soloParent)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $soloParent->resident->full_name ?? 'N/A' }}</td>
                        <td>{{ $soloParent->resident->household->purok->name ?? 'N/A' }}</td>
                        <td>{{ $soloParent->resident->household->head_name ?? 'N/A' }}</td>
                        <td>{{ $soloParent->eligibility_reason_label ?? 'N/A' }}</td>
                        <td>{{ \Carbon\Carbon::parse($soloParent->date_declared)->format('M d, Y') }}</td>
                        <td>{{ \Carbon\Carbon::parse($soloParent->valid_until)->format('M d, Y') }}</td>
                        <td>
                            @if ($soloParent->computed_status === 'active')
                                <span style="color: #28a745; font-weight: bold;">Active</span>
                            @elseif($soloParent->computed_status === 'expired')
                                <span style="color: #ffc107; font-weight: bold;">Expired</span>
                            @else
                                <span style="color: #6c757d; font-weight: bold;">Inactive</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 20px;">
                            No solo parents found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 10pt; color: #666;">
            <strong>Total Records:</strong> {{ $solo_parents->count() }}
        </div>
    </div>
@endsection
