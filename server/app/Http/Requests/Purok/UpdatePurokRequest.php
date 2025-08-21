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
        $purokId = $this->route('purok')?->id ?? null;
        return [
            'code' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('puroks', 'code')->ignore($purokId)
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'centroid_lat' => ['nullable', 'numeric'],
            'centroid_lng' => ['nullable', 'numeric'],
            'boundary_geojson' => ['nullable', 'array'],
        ];
    }
}
