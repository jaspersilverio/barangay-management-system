<?php

namespace App\Http\Requests\FourPs;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreFourPsRequest extends BaseFormRequest
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
            'household_id' => [
                'required',
                'integer',
                'exists:households,id',
                Rule::unique('four_ps_beneficiaries', 'household_id')->whereNull('deleted_at'),
            ],
            'four_ps_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('four_ps_beneficiaries', 'four_ps_number')->whereNull('deleted_at'),
            ],
            'status' => ['required', 'string', Rule::in(['active', 'suspended', 'inactive'])],
            'date_registered' => ['required', 'date', 'before_or_equal:today'],
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
            'household_id.unique' => 'This household is already registered as a 4Ps beneficiary.',
            'four_ps_number.unique' => 'This 4Ps number is already in use.',
            'date_registered.before_or_equal' => 'The registration date cannot be in the future.',
        ];
    }
}

