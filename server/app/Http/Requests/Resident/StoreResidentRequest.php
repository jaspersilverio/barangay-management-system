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
                'required',
                'integer',
                'exists:households,id',
                'min:1'
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
                'max:255',
                'sometimes'
            ],
            'last_name' => [
                'required',
                'string',
                'min:2',
                'max:255'
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
            'civil_status' => [
                'required',
                'in:single,married,widowed,divorced,separated'
            ],
            'relationship_to_head' => [
                'required',
                'string',
                'min:2',
                'max:255'
            ],
            'occupation_status' => [
                'required',
                'in:employed,unemployed,student,retired,other'
            ],
            'is_pwd' => [
                'boolean',
                'sometimes'
            ],
            'is_pregnant' => [
                'boolean',
                'sometimes'
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
            'household_id.required' => 'Household selection is required.',
            'household_id.exists' => 'The selected household does not exist.',
            'household_id.min' => 'Invalid household selection.',

            'first_name.required' => 'First name is required.',
            'first_name.min' => 'First name must be at least 2 characters.',
            'first_name.max' => 'First name cannot exceed 255 characters.',
            'middle_name.max' => 'Middle name cannot exceed 255 characters.',

            'last_name.required' => 'Last name is required.',
            'last_name.min' => 'Last name must be at least 2 characters.',
            'last_name.max' => 'Last name cannot exceed 255 characters.',

            'sex.required' => 'Gender selection is required.',
            'sex.in' => 'Please select a valid gender.',

            'birthdate.required' => 'Birthdate is required.',
            'birthdate.date' => 'Please enter a valid birthdate.',
            'birthdate.before' => 'Birthdate must be before today.',
            'birthdate.after' => 'Birthdate must be after 1900.',

            'civil_status.required' => 'Civil status is required.',
            'civil_status.in' => 'Please select a valid civil status.',

            'relationship_to_head.required' => 'Relationship to household head is required.',
            'relationship_to_head.min' => 'Relationship must be at least 2 characters.',
            'relationship_to_head.max' => 'Relationship cannot exceed 255 characters.',

            'occupation_status.required' => 'Occupation status is required.',
            'occupation_status.in' => 'Please select a valid occupation status.',

            'is_pwd.boolean' => 'PWD status must be true or false.',
        ];
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
