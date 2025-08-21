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
            'code' => ['required', 'string', 'max:255', 'unique:puroks,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'centroid_lat' => ['nullable', 'numeric'],
            'centroid_lng' => ['nullable', 'numeric'],
            'boundary_geojson' => ['nullable', 'array'],
        ];
    }
}
