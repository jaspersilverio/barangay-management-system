<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query();

        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($table = $request->string('table')->toString()) {
            $query->where('model_type', $table);
        }
        if ($action = $request->string('action')->toString()) {
            $query->where('action', $action);
        }
        if ($from = $request->date('from', null)) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->date('to', null)) {
            $query->where('created_at', '<=', $to);
        }

        $logs = $query->latest('created_at')->paginate($request->integer('per_page', 15));
        return $this->respondSuccess($logs);
    }

    public function show(AuditLog $auditLog)
    {
        return $this->respondSuccess($auditLog);
    }
}
