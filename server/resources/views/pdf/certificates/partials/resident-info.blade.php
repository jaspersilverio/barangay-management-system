<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9;">
    <div class="section-title">Resident Information</div>
    <table style="width: 100%; border: none;">
        <tr>
            <td style="border: none; padding: 5px 0; width: 30%;"><strong>Full Name:</strong></td>
            <td style="border: none; padding: 5px 0;">{{ $resident->full_name }}</td>
        </tr>
        @if($resident->household && $resident->household->address)
        <tr>
            <td style="border: none; padding: 5px 0;"><strong>Address:</strong></td>
            <td style="border: none; padding: 5px 0;">
                {{ $resident->household->address }}
                @if($resident->household->purok)
                    , Purok {{ $resident->household->purok->name }}
                @endif
            </td>
        </tr>
        @endif
        @if($resident->birthdate)
        <tr>
            <td style="border: none; padding: 5px 0;"><strong>Date of Birth:</strong></td>
            <td style="border: none; padding: 5px 0;">
                {{ \Carbon\Carbon::parse($resident->birthdate)->format('F d, Y') }}
                @if($resident->age)
                    ({{ $resident->age }} years old)
                @endif
            </td>
        </tr>
        @endif
        @if($resident->place_of_birth)
        <tr>
            <td style="border: none; padding: 5px 0;"><strong>Place of Birth:</strong></td>
            <td style="border: none; padding: 5px 0;">{{ $resident->place_of_birth }}</td>
        </tr>
        @endif
        @if($resident->civil_status)
        <tr>
            <td style="border: none; padding: 5px 0;"><strong>Civil Status:</strong></td>
            <td style="border: none; padding: 5px 0;" class="text-capitalize">{{ $resident->civil_status }}</td>
        </tr>
        @endif
        @if($resident->sex)
        <tr>
            <td style="border: none; padding: 5px 0;"><strong>Sex:</strong></td>
            <td style="border: none; padding: 5px 0;" class="text-capitalize">{{ $resident->sex }}</td>
        </tr>
        @endif
        @if($resident->contact_number)
        <tr>
            <td style="border: none; padding: 5px 0;"><strong>Contact Number:</strong></td>
            <td style="border: none; padding: 5px 0;">{{ $resident->contact_number }}</td>
        </tr>
        @endif
    </table>
</div>
