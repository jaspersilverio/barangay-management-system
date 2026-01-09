<?php

namespace App\Http\Requests\Resident;

use App\Http\Requests\BaseFormRequest;

class UpdateResidentRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();
        $isPurokLeader = $user && $user->role === 'purok_leader';

        return [
            'household_id' => [
                'sometimes',
                'nullable', // Allow setting to null for unassigned residents
                'integer',
                'exists:households,id',
                'min:1'
            ],
            'first_name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255'
            ],
            'middle_name' => [
                'nullable',
                'string',
                'max:255'
            ],
            'last_name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255'
            ],
            'suffix' => [
                'nullable',
                'string',
                'max:10'
            ],
            'sex' => [
                'sometimes',
                'required',
                'in:male,female,other'
            ],
            'birthdate' => [
                'sometimes',
                'required',
                'date',
                'before:today', // Must be before today
                'after:1900-01-01' // Must be after 1900
            ],
            'place_of_birth' => [
                'nullable',
                'string',
                'max:255'
            ],
            'nationality' => [
                'nullable',
                'string',
                'max:100'
            ],
            'religion' => [
                'nullable',
                'string',
                'max:100'
            ],
            'contact_number' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[0-9\-\+\(\)\s]+$/'
            ],
            'email' => [
                'nullable',
                'email',
                'max:255'
            ],
            'valid_id_type' => [
                'nullable',
                'string',
                'max:50'
            ],
            'valid_id_number' => [
                'nullable',
                'string',
                'max:100'
            ],
            'civil_status' => [
                'sometimes',
                'required',
                'in:single,married,widowed,divorced,separated'
            ],
            'relationship_to_head' => [
                'required_if:household_id,!=,null', // Required if household is assigned
                'nullable',
                'string',
                'min:2',
                'max:255'
            ],
            'occupation_status' => [
                'sometimes',
                'required',
                'in:employed,unemployed,student,retired,other'
            ],
            'employer_workplace' => [
                'nullable',
                'string',
                'max:255'
            ],
            'educational_attainment' => [
                'nullable',
                'string',
                'max:100'
            ],
            'is_pwd' => [
                'sometimes',
                'boolean'
            ],
            'is_pregnant' => [
                'sometimes',
                'boolean'
            ],
            'resident_status' => [
                'nullable',
                'in:active,deceased,transferred,inactive'
            ],
            'remarks' => [
                'nullable',
                'string',
                'max:1000'
            ],
            'photo' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120' // 5MB in kilobytes
            ],
        ];
    }

    /**
     * Get custom validation messages
     */
    public function messages(): array
    {
        return [
            'household_id.exists' => 'The selected household does not exist.',
            'household_id.min' => 'Invalid household selection.',

            'first_name.required' => 'First name is required.',
            'first_name.min' => 'First name must be at least 2 characters.',
            'first_name.max' => 'First name cannot exceed 255 characters.',
            'middle_name.max' => 'Middle name cannot exceed 255 characters.',

            'last_name.required' => 'Last name is required.',
            'last_name.min' => 'Last name must be at least 2 characters.',
            'last_name.max' => 'Last name cannot exceed 255 characters.',

            'suffix.max' => 'Suffix cannot exceed 10 characters.',

            'sex.required' => 'Gender selection is required.',
            'sex.in' => 'Please select a valid gender.',

            'birthdate.required' => 'Birthdate is required.',
            'birthdate.date' => 'Please enter a valid birthdate.',
            'birthdate.before' => 'Birthdate must be before today.',
            'birthdate.after' => 'Birthdate must be after 1900.',

            'place_of_birth.max' => 'Place of birth cannot exceed 255 characters.',
            'nationality.max' => 'Nationality cannot exceed 100 characters.',
            'religion.max' => 'Religion cannot exceed 100 characters.',

            'contact_number.max' => 'Contact number cannot exceed 20 characters.',
            'contact_number.regex' => 'Please enter a valid contact number format.',

            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Email cannot exceed 255 characters.',

            'valid_id_type.max' => 'Valid ID type cannot exceed 50 characters.',
            'valid_id_number.max' => 'Valid ID number cannot exceed 100 characters.',

            'civil_status.required' => 'Civil status is required.',
            'civil_status.in' => 'Please select a valid civil status.',

            'relationship_to_head.required' => 'Relationship to household head is required when assigning to a household.',
            'relationship_to_head.min' => 'Relationship must be at least 2 characters.',
            'relationship_to_head.max' => 'Relationship cannot exceed 255 characters.',

            'occupation_status.required' => 'Occupation status is required.',
            'occupation_status.in' => 'Please select a valid occupation status.',

            'employer_workplace.max' => 'Employer/Workplace cannot exceed 255 characters.',
            'educational_attainment.max' => 'Educational attainment cannot exceed 100 characters.',

            'is_pwd.boolean' => 'PWD status must be true or false.',
            'is_pregnant.boolean' => 'Pregnant status must be true or false.',

            'resident_status.in' => 'Please select a valid resident status.',
            'remarks.max' => 'Remarks cannot exceed 1000 characters.',

            'photo.image' => 'The photo must be an image file.',
            'photo.mimes' => 'The photo must be a JPEG, PNG, or WEBP file.',
            'photo.max' => 'The photo size must not exceed 5MB.',
        ];
    }

    /**
     * Prepare the data for validation - convert empty strings to null for optional fields
     */
    protected function prepareForValidation(): void
    {
        // Convert empty strings to null for optional fields
        $optionalFields = [
            'email',
            'valid_id_type',
            'valid_id_number',
            'contact_number',
            'place_of_birth',
            'nationality',
            'religion',
            'suffix',
            'middle_name',
            'employer_workplace',
            'educational_attainment',
            'remarks',
            'relationship_to_head',
        ];

        foreach ($optionalFields as $field) {
            if ($this->has($field) && $this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }
    }

    /**
     * Configure the validator instance with custom rules
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Additional validation: Check if household exists and is accessible
            if ($this->filled('household_id')) {
                $household = \App\Models\Household::find($this->household_id);
                if (!$household) {
                    $validator->errors()->add('household_id', 'The selected household does not exist.');
                    return;
                }

                // For purok leaders, ensure they can only assign to their purok
                $user = $this->user();
                if ($user && $user->isPurokLeader() && $household->purok_id != $user->assigned_purok_id) {
                    $validator->errors()->add('household_id', 'You can only assign residents to households in your assigned purok.');
                }
            }

            // If household_id is being set to null, relationship_to_head should also be null
            if ($this->filled('household_id') && $this->household_id === null) {
                $this->merge(['relationship_to_head' => null]);
            }

            // Additional validation: Check for reasonable age based on birthdate
            if ($this->filled('birthdate')) {
                $birthdate = \Carbon\Carbon::parse($this->birthdate);
                $age = $birthdate->age;

                if ($age > 120) {
                    $validator->errors()->add('birthdate', 'Please enter a valid birthdate. Age cannot exceed 120 years.');
                }

                if ($age < 0) {
                    $validator->errors()->add('birthdate', 'Birthdate cannot be in the future.');
                }
            }
        });
    }
}
