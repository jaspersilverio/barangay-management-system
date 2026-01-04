<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Test route to verify storage is accessible
Route::get('/test-storage', function () {
    $testPath = 'officials/test.txt';
    Storage::disk('public')->put($testPath, 'Storage test');
    $exists = Storage::disk('public')->exists($testPath);
    $baseUrl = config('app.url', 'http://localhost:8000');
    $url = rtrim($baseUrl, '/') . '/storage/' . $testPath;
    Storage::disk('public')->delete($testPath);

    return response()->json([
        'storage_works' => $exists,
        'storage_path' => storage_path('app/public'),
        'public_storage_link' => public_path('storage'),
        'link_exists' => file_exists(public_path('storage')),
        'test_url' => $url,
        'app_url' => config('app.url'),
    ]);
});
