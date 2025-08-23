<?php

namespace App\Http\Requests\Household;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateHouseholdRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address' => ['sometimes', 'string', 'max:255'],
            'property_type' => ['sometimes', 'string', 'max:255'],
            'head_name' => ['sometimes', 'string', 'max:255'],
            'contact' => ['sometimes', 'string', 'max:255'],
            'purok_id' => ['sometimes', 'integer', 'exists:puroks,id'],
        ];
    }
}
