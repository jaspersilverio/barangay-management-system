<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseFormRequest;

class RegisterUserRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true; // Gate in controller for admin-only
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,purok_leader,staff,viewer'],
            'assigned_purok_id' => ['nullable', 'integer', 'exists:puroks,id'],
        ];
    }
}
