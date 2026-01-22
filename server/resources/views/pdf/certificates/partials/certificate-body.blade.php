<p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
    This certification is being issued upon the request of the above-named person
    for <strong>{{ $certificate->purpose }}</strong>.
</p>

<p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
    @if($certificate_type === 'clearance')
        This clearance is valid from
    @else
        This certificate is valid from
    @endif
    <strong>{{ $valid_from_formatted ?? \Carbon\Carbon::parse($certificate->valid_from)->format('F d, Y') }}</strong>
    to <strong>{{ $valid_until_formatted ?? \Carbon\Carbon::parse($certificate->valid_until)->format('F d, Y') }}</strong>.
</p>

<p style="text-align: justify; margin: 15px 0; text-indent: 30px;">
    Issued this <strong>{{ $issued_date_formatted ?? \Carbon\Carbon::parse($certificate->created_at)->format('F d, Y') }}</strong>
    at {{ $barangay_info['name'] ?? 'this barangay' }}, {{ $barangay_info['address'] ?? '' }}.
</p>
