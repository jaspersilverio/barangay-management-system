<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    public function index(): JsonResponse
    {
        $announcements = Announcement::with('creator:id,name')
            ->latest()
            ->get();

        return $this->respondSuccess($announcements);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
        ]);

        $announcement = Announcement::create([
            ...$data,
            'created_by' => Auth::id(),
        ]);

        $announcement->load('creator:id,name');

        return $this->respondSuccess($announcement, 'Announcement created successfully', 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
        ]);

        $announcement->update($data);
        $announcement->load('creator:id,name');

        return $this->respondSuccess($announcement, 'Announcement updated successfully');
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return $this->respondSuccess(null, 'Announcement deleted successfully');
    }
}
