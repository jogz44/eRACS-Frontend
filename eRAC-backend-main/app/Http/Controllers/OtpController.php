<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\OtpService;

class OtpController extends Controller
{
    protected $otp;

    public function __construct(OtpService $otp)
    {
        $this->otp = $otp;
    }

    public function generate(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        if ($this->otp->generate($request->email)) {
            return response()->json(['status' => 'success', 'message' => 'OTP sent successfully.']);
        }
        return response()->json(['status' => 'error', 'message' => $this->otp->error], 500);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string'
        ]);

        if ($this->otp->verify($request->email, $request->otp)) {
            return response()->json(['status' => 'success', 'message' => 'OTP verified.']);
        }
        return response()->json(['status' => 'error', 'message' => $this->otp->error], 400);
    }
}
