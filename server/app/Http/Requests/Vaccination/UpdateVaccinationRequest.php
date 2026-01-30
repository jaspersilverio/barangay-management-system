<?php

namespace App\Http\Requests\Vaccination;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVaccinationRequest extends FormRequest
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
            'resident_id' => 'required|exists:residents,id',
            'vaccination_type' => 'required|in:fixed_dose,booster,annual,as_needed',
            'required_doses' => 'required_if:vaccination_type,fixed_dose|nullable|integer|min:1',
            'schedule_date' => 'nullable|date|after_or_equal:today',
            'vaccine_name' => 'nullable|string|max:255',
            'administered_by' => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'resident_id.required' => 'Resident is required.',
            'resident_id.exists' => 'Selected resident does not exist.',
            'vaccination_type.required' => 'Vaccination type is required.',
            'vaccination_type.in' => 'Vaccination type must be one of: Fixed Dose, Booster, Annual, As Needed.',
            'required_doses.required_if' => 'Required doses is required for Fixed Dose vaccinations.',
            'required_doses.min' => 'Required doses must be at least 1.',
            'schedule_date.date' => 'Schedule date must be a valid date.',
            'schedule_date.after_or_equal' => 'Schedule date must be today or a future date.',
            'administered_by.max' => 'Administered by must not exceed 255 characters.',
        ];
    }
}
