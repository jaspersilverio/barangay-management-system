<?php

namespace App\Http\Requests\Purok;

use App\Http\Requests\BaseFormRequest;

class StorePurokRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'max:255', 'unique:puroks,code'],
            'name' => ['required', 'string', 'max:255'],
            'captain' => ['required', 'string', 'max:255'],
            'contact' => ['required', 'string', 'max:255'],
        ];
    }
}
