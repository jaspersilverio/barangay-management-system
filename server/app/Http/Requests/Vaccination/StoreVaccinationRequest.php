<?php

namespace App\Http\Requests\Vaccination;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVaccinationRequest extends FormRequest
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
            'vaccine_name' => 'required|string|max:255',
            'dose_number' => 'required|string|max:50',
            'date_administered' => 'required|date|before_or_equal:today',
            'next_due_date' => 'nullable|date|after:date_administered',
            'status' => ['required', Rule::in(['Completed', 'Pending', 'Scheduled'])],
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
            'vaccine_name.required' => 'Vaccine name is required.',
            'vaccine_name.max' => 'Vaccine name must not exceed 255 characters.',
            'dose_number.required' => 'Dose number is required.',
            'dose_number.max' => 'Dose number must not exceed 50 characters.',
            'date_administered.required' => 'Date administered is required.',
            'date_administered.date' => 'Date administered must be a valid date.',
            'date_administered.before_or_equal' => 'Date administered cannot be in the future.',
            'next_due_date.date' => 'Next due date must be a valid date.',
            'next_due_date.after' => 'Next due date must be after the date administered.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: Completed, Pending, Scheduled.',
            'administered_by.max' => 'Administered by must not exceed 255 characters.',
        ];
    }
}
