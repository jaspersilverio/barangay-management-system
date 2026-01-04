<?php

namespace App\Http\Requests\SoloParent;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateSoloParentRequest extends BaseFormRequest
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
        $soloParentId = $this->route('soloParent')?->id ?? $this->route('solo_parent');

        return [
            'eligibility_reason' => [
                'sometimes',
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
            'date_declared' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'valid_until' => ['sometimes', 'required', 'date', 'after:date_declared'],
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
            'valid_until.after' => 'The valid until date must be after the date declared.',
            'date_declared.before_or_equal' => 'The declaration date cannot be in the future.',
        ];
    }
}

