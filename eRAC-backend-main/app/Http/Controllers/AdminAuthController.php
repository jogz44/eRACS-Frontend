<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use App\Models\Admin;
use App\Models\BarangayUser;

//use Symfony\Component\HttpFoundation\Cookie;

class AdminAuthController extends Controller  // <-- This is crucial
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $admin = Admin::where('email', $credentials['email'])->first();

        if (!$admin || !Hash::check($credentials['password'], $admin->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $admin->createToken('admin-token', ['admin'])->plainTextToken;

        $cookie = cookie(
            'admin_token',
            $token,
            1440, // 1 day in minutes
            null,
            null,
            config('app.env') === 'production',
            true,
            false,
            'Lax'
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Logged in successfully',
            'token' => $token,
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email,
                'name' => $admin->name ?? 'Admin'
            ]
        ])->withCookie($cookie);
    }

    public function logout(Request $request)
    {
        $request->user('admin')->tokens()->delete();
        $cookie = Cookie::forget('admin_token');

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully logged out'
        ])->withCookie($cookie);
    }

    // Get pending users (not approved)
    public function getPendingUsers()
    {
        $users = BarangayUser::where('is_approved', false)
            ->with('barangay')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'barangay' => $user->barangay->name,
                    'position' => $user->position,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar' => $user->photo_url,
                    'created_at' => $user->created_at->format('F j, Y'),
                ];
            });

        return response()->json($users);
    }

    // Get accepted users (approved)
    public function getAcceptedUsers()
    {
        $users = BarangayUser::where('is_approved', true)
            ->with('barangay')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'barangay' => $user->barangay->name,
                    'position' => $user->position,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar' => $user->photo_url,
                    'created_at' => $user->created_at->format('F j, Y'),
                ];
            });

        return response()->json($users);
    }

    // Approve a user
    public function approveUser(Request $request, BarangayUser $user)
    {
        $user->update(['is_approved' => true]);

        return response()->json([
            'message' => 'User approved successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
            ]
        ]);
    }

    // Delete a user
    public function deleteUser(BarangayUser $user)
    {
        $userName = $user->first_name . ' ' . $user->last_name;
        $user->delete();

        return response()->json([
            'message' => "User {$userName} deleted successfully"
        ]);
    }

    // Get all users with permissions
    public function getUsersWithPermissions() {
        return BarangayUser::select('id', 'first_name', 'last_name', 'username', 'position', 'permissions')
            ->get();
    }

    // Update user permissions
    public function updateUserPermissions(Request $request, $id) {
        $user = BarangayUser::findOrFail($id);
        $user->permissions = $request->input('permissions');
        $user->save();
        return response()->json(['success' => true]);
    }

    // Get logs
    public function getLogs() {
        return response()->json(DB::table('logs')->orderBy('created_at', 'desc')->get());
    }

    // Helper to log user actions (can be called from other controllers)
    public static function logUserAction($user, $activity, $details = null) {
        DB::table('logs')->insert([
            'user_id' => $user->id,
            'fullname' => $user->first_name . ' ' . $user->last_name,
            'activity' => $activity,
            'details' => $details,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    public static function getPerBarangaysBudgets()
    {
        $data = DB::table('barangays')
            ->leftJoin('budgets', 'barangays.id', '=', 'budgets.barangay_id')
            ->select(
                'barangays.id',
                'barangays.name as barangay_name',
                DB::raw('COALESCE(SUM(budgets.original_amount), 0) as total_original_amount'),
                DB::raw('COALESCE(SUM(budgets.current_amount), 0) as total_current_amount'),
                DB::raw('COUNT(budgets.id) as total_budget_entries')
            )
            ->groupBy('barangays.id', 'barangays.name')
            ->orderBy('barangay_name', 'asc')
            ->get();

        return response()->json($data);
    }
}
