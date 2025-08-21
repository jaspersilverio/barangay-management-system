<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseFormRequest extends FormRequest
{
    protected function failedValidation(Validator $validator)
    {
        $response = response()->json([
            'success' => false,
            'data' => null,
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors()->toArray(),
        ], 422);

        throw new HttpResponseException($response);
    }
}
