@extends('pdf.layouts.base')

@section('content')
    <div class="section">
        <table>
            <thead>
                <tr>
                    <th style="width: 20%;">Purok</th>
                    <th style="width: 15%;">Captain</th>
                    <th style="width: 12%;">Contact</th>
                    <th style="width: 12%;">Households</th>
                    <th style="width: 12%;">Residents</th>
                    <th style="width: 15%;">Gender</th>
                    <th style="width: 14%;">Vulnerable Groups</th>
                </tr>
            </thead>
            <tbody>
                @forelse($puroks as $purok)
                    <tr>
                        <td>
                            <strong>{{ $purok['name'] }}</strong><br>
                            <small style="font-size: 8pt; color: #666;">ID: {{ $purok['id'] }}</small>
                        </td>
                        <td>{{ $purok['captain'] }}</td>
                        <td>{{ $purok['contact'] }}</td>
                        <td style="text-align: center;"><strong>{{ $purok['household_count'] }}</strong></td>
                        <td style="text-align: center;"><strong>{{ $purok['resident_count'] }}</strong></td>
                        <td style="text-align: center;">
                            <div style="font-size: 9pt;">
                                <div>M: {{ $purok['male_count'] }}</div>
                                <div>F: {{ $purok['female_count'] }}</div>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <div style="font-size: 9pt;">
                                <div>Children: {{ $purok['child_count'] }}</div>
                                <div>Seniors: {{ $purok['senior_count'] }}</div>
                                <div>PWDs: {{ $purok['pwd_count'] }}</div>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px;">
                            No puroks found
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Summary Totals -->
        <div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd;">
            <div class="section-title">Summary Totals</div>
            <table style="margin-top: 10px;">
                <tr>
                    <td style="width: 25%; border: none; padding: 5px;"><strong>Total Households:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['households'] }}</td>
                    <td style="width: 25%; border: none; padding: 5px;"><strong>Total Residents:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['residents'] }}</td>
                </tr>
                <tr>
                    <td style="border: none; padding: 5px;"><strong>Males:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['males'] }}</td>
                    <td style="border: none; padding: 5px;"><strong>Females:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['females'] }}</td>
                </tr>
                <tr>
                    <td style="border: none; padding: 5px;"><strong>Children:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['children'] }}</td>
                    <td style="border: none; padding: 5px;"><strong>Seniors:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['seniors'] }}</td>
                </tr>
                <tr>
                    <td style="border: none; padding: 5px;"><strong>PWDs:</strong></td>
                    <td style="border: none; padding: 5px;">{{ $totals['pwds'] }}</td>
                    <td style="border: none; padding: 5px;"></td>
                    <td style="border: none; padding: 5px;"></td>
                </tr>
            </table>
        </div>

        <div style="margin-top: 20px; font-size: 10pt; color: #666;">
            <strong>Total Puroks:</strong> {{ $puroks->count() }}
        </div>
    </div>
@endsection
