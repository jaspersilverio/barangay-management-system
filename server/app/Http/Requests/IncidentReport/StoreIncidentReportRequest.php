<?php

namespace App\Http\Requests\IncidentReport;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncidentReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure incident_date and incident_time are always set for validation
        $this->merge([
            'incident_date' => $this->input('incident_date') ? trim($this->input('incident_date')) : null,
            'incident_time' => $this->input('incident_time') ? trim($this->input('incident_time')) : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'incident_title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'incident_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'incident_time' => ['required', 'date_format:H:i'],
            'location' => ['required', 'string', 'max:255'],
            'persons_involved' => ['nullable', 'string'], // Will be stored as JSON
            'reporting_officer_id' => ['nullable', 'exists:users,id'],
            'status' => ['sometimes', 'in:Recorded,Monitoring,Resolved'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'incident_title.required' => 'Incident title is required.',
            'incident_title.max' => 'Incident title cannot exceed 255 characters.',
            'description.required' => 'Description is required.',
            'incident_date.required' => 'Incident date is required.',
            'incident_date.date_format' => 'The incident date must be in YYYY-MM-DD format.',
            'incident_date.before_or_equal' => 'Incident date cannot be in the future.',
            'incident_time.required' => 'Incident time is required.',
            'incident_time.date_format' => 'Please enter a valid time format (HH:MM in 24-hour format).',
            'location.required' => 'Location is required.',
            'location.max' => 'Location cannot exceed 255 characters.',
            'reporting_officer_id.required' => 'Reporting officer is required.',
            'reporting_officer_id.exists' => 'The selected reporting officer does not exist.',
            'status.in' => 'Status must be Recorded, Monitoring, or Resolved.',
        ];
    }
}
