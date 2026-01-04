<?php

namespace App\Http\Requests\SoloParent;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreSoloParentRequest extends BaseFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'resident_id' => [
                'required',
                'integer',
                'exists:residents,id',
                Rule::unique('solo_parents', 'resident_id')->whereNull('deleted_at'),
            ],
            'eligibility_reason' => [
                'required',
                'string',
                Rule::in([
                    'death_of_spouse',
                    'abandonment',
                    'legally_separated',
                    'unmarried_parent',
                    'spouse_incapacitated'
                ]),
            ],
            'date_declared' => ['required', 'date', 'before_or_equal:today'],
            'valid_until' => ['required', 'date', 'after:date_declared'],
            'verification_date' => ['nullable', 'date', 'before_or_equal:today'],
            'verified_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resident_id.unique' => 'This resident is already registered as a solo parent.',
            'valid_until.after' => 'The valid until date must be after the date declared.',
            'date_declared.before_or_equal' => 'The declaration date cannot be in the future.',
        ];
    }
}

