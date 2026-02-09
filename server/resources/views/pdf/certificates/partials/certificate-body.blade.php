<p class="purpose-statement">
    This certification is being issued upon the request of the above-named individual
    for <strong>{{ strtoupper($certificate->purpose ?? '') }}</strong> purposes and for whatever
    legal intent it may serve.
</p>

@php
    $issueDate = ($certificate->created_at ?? null) ? \Carbon\Carbon::parse($certificate->created_at) : now();
    $dayOrdinal = $issueDate->format('jS');
    $monthYear = $issueDate->format('F, Y');
@endphp
<p class="issue-statement">
    Given this <strong>{{ $dayOrdinal }}</strong> 
    day of <strong>{{ $monthYear }}</strong>
    at Barangay {{ $barangay_info['name'] ?? '' }}, 
    @if(!empty($barangay_info['municipality']))
        {{ $barangay_info['municipality'] }},
    @endif
    @if(!empty($barangay_info['province']))
        {{ $barangay_info['province'] }},
    @endif
    Philippines.
</p>
