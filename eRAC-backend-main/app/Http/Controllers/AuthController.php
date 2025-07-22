<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use App\Models\BarangayUser;
use App\Models\Barangay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\AdminAuthController;

class AuthController extends Controller
{

     public function index()

    {
        $barangayUser = BarangayUser::all();
        return response()->json($barangayUser);

    }

public function register(Request $request)
{
    $validated = $request->validate([
        'first_name' => 'required|string|max:255',
        'middle_name' => 'nullable|string|max:255',
        'last_name' => 'required|string|max:255',
        'barangay_id' => 'required|exists:barangays,id',
        'position' => 'required|string|max:255',
        'suffix' => 'nullable|string|max:255',
        'email' => 'required|string|email|max:255|unique:barangay_users',
        'username' => 'required|string|max:255|unique:barangay_users',
        'password' => 'required|string|min:8|confirmed',
        'photo_path' => 'required|string',
        'is_approved' => 'sometimes|boolean'
    ]);

    $user = BarangayUser::create([
        'first_name' => $validated['first_name'],
        'middle_name' => $validated['middle_name'],
        'last_name' => $validated['last_name'],
        'barangay_id' => $validated['barangay_id'],
        'position' => $validated['position'],
        'suffix' => $validated['suffix'],
        'email' => $validated['email'],
        'username' => $validated['username'],
        'password' => Hash::make($validated['password']),
        'photo_path' => $validated['photo_path'],
        'is_approved' => false, // Set to false by default - requires admin approval
        'role' => 'barangay_user'
    ]);

    AdminAuthController::logUserAction($user, 'Registration','User registration to system');

    return response()->json([
        'message' => 'Registration successful',
        'user' => $user
    ], 201);
}

   public function uploadPhoto(Request $request)
   {
    $validated = $request->validate([
        'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
    ]);

    $path = $request->file('photo')->store('profile-photos', 'public');

    return response()->json([
        'path' => $path,
        'url' => Storage::url($path)
    ]);
}


public function login(Request $request)
{
    $credentials = $request->validate([
        'username' => 'required|string',
        'password' => 'required|string',
    ]);

    // MANUAL CREDENTIALS VERIFICATION
    $user = \App\Models\BarangayUser::where('username', $credentials['username'])->first();

    if (!$user || !\Hash::check($credentials['password'], $user->password)) {
        return response()->json([
            'status' => 'error',
            'message' => 'Invalid credentials'
        ], 401);
    }

    // Check if user is approved
    if (!$user->is_approved) {
        return response()->json([
            'status' => 'error',
            'message' => 'Your account is pending approval. Please contact the administrator.'
        ], 403);
    }
    
    AdminAuthController::logUserAction($user, 'Login','User login to system');

    // CREATE SANCTUM TOKEN
    $token = $user->createToken('barangay_token')->plainTextToken;

    $cookie = cookie(
        'auth_token',
        $token,
        60 * 24, // 1 day
        null, null, true, true, false, 'None'
    );

    // Log user login

    return response()->json([
        'status' => 'success',
        'message' => 'Logged in successfully',
        //'user' => $user,
        'user' => [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'barangay_name' => $user->barangay->name,
            'position' => $user->position,
           'photo_url' => $user->photo_path
                ? asset("storage/{$user->photo_path}")
                : null, // Returns full URL like http://localhost/storage/profile-photos/filename.jpg
        ],
        'access_token' => $token,
        'token_type' => 'Bearer',
    ])->withCookie($cookie);
}

   public function logout(Request $request)
{
    try {
        // Get the authenticated user with the correct guard
        $user = $request->user('barangay'); // Explicitly specify guard

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'No authenticated user found'
            ], 401);
        }

        // Revoke the current token
        $user->currentAccessToken()->delete();
        AdminAuthController::logUserAction($user, 'Logout','User logout from the System');

        return response()->json([
            'status' => true,
            'message' => 'Successfully logged out'
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => 'Logout failed',
            'error' => $e->getMessage()
        ], 500);
    }
}

public function user(Request $request)
{
    $user = $request->user()->load('barangay');

    return response()->json([
        'user' => [
            'first_name' => $user->first_name ?? '',
            'last_name' => $user->last_name ?? '',
            'barangay_name' => $user->barangay->name ?? '',
            'position' => $user->position ?? '',
            'photo_path' => $user->photo_path ?? null,
            'photo_url' => $user->photo_path ? asset("storage/{$user->photo_path}") : null
        ]
    ]);
}

public function checkEmailExists(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email'
    ]);

    $user = BarangayUser::where('email', $validated['email'])->first();

    return response()->json([
        'exists' => $user !== null,
        'message' => $user ? 'Email found' : 'Email not found'
    ]);
}

public function resetPassword(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'password' => 'required|string|min:8|confirmed',
    ]);

    $user = BarangayUser::where('email', $validated['email'])->first();

    if (!$user) {
        return response()->json([
            'message' => 'Email not found in our database'
        ], 404);
    }

    // Update the user's password
    $user->password = Hash::make($validated['password']);
    $user->save();

    AdminAuthController::logUserAction($user, 'Reset Password','User reset their account password');

    return response()->json([
        'message' => 'Password reset successful',
        'user' => [
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name
        ]
    ]);
}
}
