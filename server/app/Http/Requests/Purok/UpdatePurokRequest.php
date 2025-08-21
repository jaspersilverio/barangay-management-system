<?php

namespace App\Http\Requests\Purok;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdatePurokRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'captain' => ['sometimes', 'string', 'max:255'],
            'contact' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
