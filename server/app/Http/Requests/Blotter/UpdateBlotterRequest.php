<?php

namespace App\Http\Requests\Blotter;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlotterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Complainant validation
            'complainant_is_resident' => ['sometimes', 'boolean'],
            'complainant_id' => ['sometimes', 'required_if:complainant_is_resident,true', 'nullable', 'exists:residents,id'],
            'complainant_full_name' => ['sometimes', 'required_if:complainant_is_resident,false', 'nullable', 'string', 'max:255'],
            'complainant_age' => ['sometimes', 'required_if:complainant_is_resident,false', 'nullable', 'integer', 'min:1', 'max:120'],
            'complainant_address' => ['sometimes', 'required_if:complainant_is_resident,false', 'nullable', 'string'],
            'complainant_contact' => ['sometimes', 'nullable', 'string', 'max:20'],

            // Respondent validation
            'respondent_is_resident' => ['sometimes', 'boolean'],
            'respondent_id' => ['sometimes', 'required_if:respondent_is_resident,true', 'nullable', 'exists:residents,id'],
            'respondent_full_name' => ['sometimes', 'required_if:respondent_is_resident,false', 'nullable', 'string', 'max:255'],
            'respondent_age' => ['sometimes', 'required_if:respondent_is_resident,false', 'nullable', 'integer', 'min:1', 'max:120'],
            'respondent_address' => ['sometimes', 'required_if:respondent_is_resident,false', 'nullable', 'string'],
            'respondent_contact' => ['sometimes', 'nullable', 'string', 'max:20'],

            // Other fields
            'official_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'incident_date' => ['sometimes', 'date', 'before_or_equal:today'],
            'incident_time' => ['sometimes', 'date_format:H:i'],
            'incident_location' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', 'in:Open,Ongoing,Resolved'],
            'resolution' => ['sometimes', 'nullable', 'string'],
            'attachments' => ['sometimes', 'nullable', 'array'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,pdf,doc,docx', 'max:10240'], // 10MB max
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            // Complainant messages
            'complainant_id.required_if' => 'Please select a complainant from residents.',
            'complainant_id.exists' => 'The selected complainant does not exist.',
            'complainant_full_name.required_if' => 'Complainant full name is required for non-residents.',
            'complainant_age.required_if' => 'Complainant age is required for non-residents.',
            'complainant_age.min' => 'Complainant age must be at least 1.',
            'complainant_age.max' => 'Complainant age cannot exceed 120.',
            'complainant_address.required_if' => 'Complainant address is required for non-residents.',
            'complainant_contact.max' => 'Complainant contact cannot exceed 20 characters.',

            // Respondent messages
            'respondent_id.required_if' => 'Please select a respondent from residents.',
            'respondent_id.exists' => 'The selected respondent does not exist.',
            'respondent_full_name.required_if' => 'Respondent full name is required for non-residents.',
            'respondent_age.required_if' => 'Respondent age is required for non-residents.',
            'respondent_age.min' => 'Respondent age must be at least 1.',
            'respondent_age.max' => 'Respondent age cannot exceed 120.',
            'respondent_address.required_if' => 'Respondent address is required for non-residents.',
            'respondent_contact.max' => 'Respondent contact cannot exceed 20 characters.',

            // Other messages
            'official_id.exists' => 'The selected official does not exist.',
            'incident_date.before_or_equal' => 'Incident date cannot be in the future.',
            'incident_time.date_format' => 'Please enter a valid time format (HH:MM).',
            'incident_location.max' => 'Incident location cannot exceed 255 characters.',
            'status.in' => 'Status must be Open, Ongoing, or Resolved.',
            'attachments.*.file' => 'Each attachment must be a valid file.',
            'attachments.*.mimes' => 'Attachments must be images, PDFs, or documents.',
            'attachments.*.max' => 'Each attachment cannot exceed 10MB.',
        ];
    }
}
