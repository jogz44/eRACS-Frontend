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

        // Log admin login
        AdminAuthController::logUserAction($admin, 'Login', 'Admin login to system');

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
                'name' => $admin->name ?? 'Admin',
                'role' => $admin->role
            ]
        ])->withCookie($cookie);
    }

    public function logout(Request $request)
    {
        $admin = $request->user('admin');
        
        // Log admin logout
        if ($admin) {
            AdminAuthController::logUserAction($admin, 'Logout', 'Admin logout from system');
        }
        
        // Delete ALL tokens for this admin to ensure complete logout
        $admin->tokens()->delete();
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
            ->with(['barangay', 'position'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'barangay' => $user->barangay->name,
                    'position' => $user->position->name,
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
            ->with(['barangay', 'position'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'barangay' => $user->barangay->name,
                    'position' => $user->position->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar' => $user->photo_url,
                    'permissions' => $user->permissions,
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
        return BarangayUser::with('position')
            ->select('id', 'first_name', 'last_name', 'username', 'position_id', 'permissions')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'username' => $user->username,
                    'position' => $user->position->name,
                    'permissions' => $user->permissions,
                ];
            });
    }

    // Update user permissions
    public function updateUserPermissions(Request $request, $id) {
        try {
            $user = BarangayUser::findOrFail($id);
            
            // Validate the permissions data
            $validated = $request->validate([
                'permissions' => 'required|array',
                'permissions.view' => 'boolean',
                'permissions.add' => 'boolean',
                'permissions.edit' => 'boolean',
                'permissions.delete' => 'boolean',
                'permissions.print' => 'boolean',
            ]);
            
            $user->permissions = $validated['permissions'];
            $user->save();
            
            return response()->json([
                'status' => 'success',
                'message' => 'User permissions updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get logs
    public function getAllLogs() {
        $logs = DB::table('logs')
        ->join('barangay_users', 'logs.user_id', '=', 'barangay_users.id')
        ->join('barangays', 'barangay_users.barangay_id', '=', 'barangays.id')
        ->join('barangay_positions', 'barangay_users.position_id', '=', 'barangay_positions.id')
        ->select(
            'logs.user_id as id',
            'logs.fullname',
            DB::raw('CAST(logs.created_at AS DATE) as log_date'),
            DB::raw('COUNT(logs.id) as total_logs'),
            'barangays.name as barangay',
            'barangay_positions.name as position'
        )
        ->groupBy(
            'logs.user_id',
            'logs.fullname',
            DB::raw('CAST(logs.created_at AS DATE)'),
            'barangays.name',
            'barangay_positions.name'
        )
        ->orderByDesc(DB::raw('CAST(logs.created_at AS DATE)'))
        ->get();

        return response()->json($logs);
    }

    // Get admin logs
    public function getAdminLogs() {
        $logs = DB::table('admin_logs')
            ->join('admins', 'admin_logs.admin_id', '=', 'admins.id')
            ->select(
                'admin_logs.id',
                'admin_logs.activity',
                'admin_logs.details',
                'admin_logs.created_at',
                'admins.name as admin_name'
            )
            ->orderByDesc('admin_logs.created_at')
            ->get();
        return response()->json($logs);
    }

    // Get individual user logs
    public function getUserLogs($userId, $day) {
        $logs = DB::table('logs')
            ->join('barangay_users', 'logs.user_id', '=', 'barangay_users.id')
            ->join('barangays', 'barangay_users.barangay_id', '=', 'barangays.id')
            ->join('barangay_positions', 'barangay_users.position_id', '=', 'barangay_positions.id')
            ->select(
                'logs.id',
                'logs.activity',
                'logs.details',
                'logs.created_at',
                'barangays.name as barangay',
                'barangay_positions.name as position',
                'barangay_users.first_name',
                'barangay_users.last_name'
            )
            ->where('barangay_users.id', $userId)
            ->whereDate('logs.created_at', $day)
            ->orderByDesc('logs.created_at')
            ->get();
        return response()->json($logs);
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

    // Log admin actions
    public function logAdminAction(Request $request) {
        $validated = $request->validate([
            'activity' => 'required|string',
            'details' => 'nullable|string'
        ]);

        // Ensure we resolve the authenticated admin explicitly
        $admin = $request->user();
        if (!$admin) {
            $admin = Auth::user();
        }
        if (!$admin || !($admin instanceof Admin)) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized'
            ], 401);
        }
        $admin = $request->user();
        if (!$admin) {
            $admin = Auth::user();
        }
        if (!$admin || !($admin instanceof Admin)) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        DB::table('admin_logs')->insert([
            'admin_id' => $admin->id,
            'fullname' => $admin->name ?? 'Admin',
            'activity' => $validated['activity'],
            'details' => $validated['details'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('admin_logs')->insert([
            'admin_id' => $admin->id,
            'fullname' => $admin->name ?? 'Admin',
            'activity' => $validated['activity'],
            'details' => $validated['details'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Action logged successfully']);
    }

    // Log user actions (instance method for route)
    public function logUserActionRequest(Request $request) {
        $validated = $request->validate([
            'activity' => 'required|string',
            'details' => 'nullable|string'
        ]);

        $user = $request->user();
        
        DB::table('logs')->insert([
            'user_id' => $user->id,
            'fullname' => $user->first_name . ' ' . $user->last_name,
            'activity' => $validated['activity'],
            'details' => $validated['details'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Action logged successfully']);
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

    /**
     * Heartbeat endpoint to keep admin session alive
     */
    public function heartbeat(Request $request)
    {
        try {
            $admin = Auth::user();
            
            if (!$admin) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Don't log heartbeat activity to keep logs clean

            return response()->json([
                'message' => 'Heartbeat received',
                'timestamp' => now(),
                'admin_id' => $admin->id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing heartbeat: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Inactivity logout endpoint - deletes all tokens for the admin
     */
    public function inactivityLogout(Request $request)
    {
        try {
            $admin = Auth::user();
            
            if (!$admin) {
                return response()->json([
                    'message' => 'No authenticated admin found'
                ], 401);
            }

            // Delete ALL tokens for this admin
            $admin->tokens()->delete();
            
            // Log the inactivity logout
            AdminAuthController::logUserAction($admin, 'Logout', 'Logged out due to inactivity');

            return response()->json([
                'status' => true,
                'message' => 'Successfully logged out due to inactivity'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Inactivity logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
