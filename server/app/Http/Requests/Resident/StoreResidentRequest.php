<?php

namespace App\Http\Requests\Resident;

use App\Http\Requests\BaseFormRequest;

class StoreResidentRequest extends BaseFormRequest
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
                'nullable', // Allow creating residents without household (unassigned)
                function ($attribute, $value, $fail) {
                    // Only validate if household_id is provided and not null/empty
                    if ($value !== null && $value !== '' && $value !== 0) {
                        if (!is_numeric($value)) {
                            $fail('The household ID must be a number.');
                            return;
                        }
                        if (!\App\Models\Household::where('id', (int)$value)->exists()) {
                            $fail('The selected household does not exist.');
                        }
                    }
                },
            ],
            'first_name' => [
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
                'required',
                'in:male,female,other'
            ],
            'birthdate' => [
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
                'regex:/^[0-9\-\+\(\)\s]*$/' // Allow empty string, numbers, dashes, plus, parentheses, spaces
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
                'required',
                'in:single,married,widowed,divorced,separated'
            ],
            'relationship_to_head' => [
                'nullable',
                'string',
                'max:255'
            ],
            'occupation_status' => [
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
                'nullable',
                'boolean'
            ],
            'is_pregnant' => [
                'nullable',
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
            'purok_id' => [
                'nullable',
                'string'
            ],
        ];
    }

    /**
     * Get custom validation messages
     */
    public function messages(): array
    {
        return [
            'household_id.required' => 'Household selection is required when assigning to a household.',
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

            'relationship_to_head.required' => 'Relationship to household head is required.',
            'relationship_to_head.min' => 'Relationship must be at least 2 characters.',
            'relationship_to_head.max' => 'Relationship cannot exceed 255 characters.',

            'occupation_status.required' => 'Occupation status is required.',
            'occupation_status.in' => 'Please select a valid occupation status.',

            'employer_workplace.max' => 'Employer/Workplace cannot exceed 255 characters.',
            'educational_attainment.max' => 'Educational attainment cannot exceed 100 characters.',

            'is_pwd.boolean' => 'PWD status must be true or false.',

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
            'household_id', // Add household_id to optional fields
        ];

        foreach ($optionalFields as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);
                // Convert empty string, '0', or null to null
                if ($value === '' || $value === '0' || $value === null) {
                    $this->merge([$field => null]);
                }
            }
        }
        
        // Special handling: If household_id is null/empty, relationship_to_head MUST be null
        // This MUST happen before validation rules run
        $householdId = $this->input('household_id');
        if ($householdId === null || $householdId === '' || $householdId === 0 || $householdId === '0') {
            // Force household_id and relationship_to_head to null
            $this->merge([
                'household_id' => null,
                'relationship_to_head' => null
            ]);
        }
        
        // Handle boolean fields - convert string 'true'/'false' to actual booleans
        if ($this->has('is_pwd')) {
            $value = $this->input('is_pwd');
            if ($value === 'true' || $value === '1' || $value === 1 || $value === true) {
                $this->merge(['is_pwd' => true]);
            } elseif ($value === 'false' || $value === '0' || $value === 0 || $value === false || $value === '' || $value === null) {
                $this->merge(['is_pwd' => false]);
            }
        } else {
            // Default to false if not provided
            $this->merge(['is_pwd' => false]);
        }
        
        if ($this->has('is_pregnant')) {
            $value = $this->input('is_pregnant');
            if ($value === 'true' || $value === '1' || $value === 1 || $value === true) {
                $this->merge(['is_pregnant' => true]);
            } elseif ($value === 'false' || $value === '0' || $value === 0 || $value === false || $value === '' || $value === null) {
                $this->merge(['is_pregnant' => false]);
            }
        } else {
            // Default to false if not provided
            $this->merge(['is_pregnant' => false]);
        }
    }

    /**
     * Configure the validator instance with custom rules
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Additional validation: Check if household exists and is accessible
            // Only validate if household_id is provided and not null
            if ($this->filled('household_id') && $this->household_id !== null && $this->household_id !== '') {
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

            // Additional validation: Ensure relationship_to_head is provided when household_id is set
            // Get household_id from input (after prepareForValidation has run)
            $householdId = $this->input('household_id');
            
            // Only require relationship_to_head if household_id is actually set (not null, not empty)
            if ($householdId !== null && $householdId !== '' && $householdId !== 0 && $householdId !== '0') {
                $relationshipToHead = $this->input('relationship_to_head');
                if (empty($relationshipToHead) || (is_string($relationshipToHead) && trim($relationshipToHead) === '')) {
                    $validator->errors()->add('relationship_to_head', 'Relationship to head is required when assigning to a household.');
                }
            }
            // If household_id is null, relationship_to_head should already be null from prepareForValidation

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
