{{-- Resident Information Box (Compact) --}}
<div class="info-box">
    <table>
        <tr>
            <td class="info-label">Full Name:</td>
            <td><strong>{{ strtoupper($resident->full_name) }}</strong></td>
            @if($resident->age)
            <td class="info-label" style="width: 15%;">Age:</td>
            <td style="width: 20%;">{{ $resident->age }} yrs old</td>
            @endif
        </tr>
        @if($resident->household && $resident->household->address)
        <tr>
            <td class="info-label">Address:</td>
            <td colspan="3">
                {{ $resident->household->address }}
                @if($resident->household->purok), {{ $resident->household->purok->name }}@endif
            </td>
        </tr>
        @endif
        <tr>
            @if($resident->civil_status)
            <td class="info-label">Civil Status:</td>
            <td style="text-transform: capitalize;">{{ $resident->civil_status }}</td>
            @endif
            @if($resident->sex)
            <td class="info-label" style="width: 15%;">Sex:</td>
            <td style="text-transform: capitalize; width: 20%;">{{ $resident->sex }}</td>
            @endif
        </tr>
    </table>
</div>
