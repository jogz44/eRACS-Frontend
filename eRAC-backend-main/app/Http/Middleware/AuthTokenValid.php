<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;

class AuthTokenValid
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check for token in cookie or Authorization header
        $token = $request->cookie('auth_token') ?? $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized. Missing token.',
            ], 401);
        }

        // 2. Validate and fetch token
        $accessToken = PersonalAccessToken::findToken($token);

        if (!$accessToken) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized. Invalid token.',
            ], 401);
        }

        // 3. Check timeout (1 min inactivity)
        if ($accessToken->last_used_at) {
            $minutes = Carbon::parse($accessToken->created_at)->diffInMinutes(now());

            if ($minutes >= 1) {
                $accessToken->delete();

                return response()->json([
                    'status' => false,
                    'message' => 'Session expired. Please login again.',
                ], 401);
            }
        } else {
            // First use → set it now
            $accessToken->forceFill(['created_at' => now()])->save();
        }

        // 5. Continue request
        $response = $next($request);

        // 6. Wrap JSON response
        if ($request->wantsJson() && $response->getStatusCode() === 200) {
            $originalData = json_decode($response->content(), true) ?? [];

            if (!isset($originalData['status'])) {
                $response->setData([
                    'status' => true,
                    'message' => 'Request successful',
                    'data' => $originalData,
                ]);
            }
        }

        return $response;
    }
}
