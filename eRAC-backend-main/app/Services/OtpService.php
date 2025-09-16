<?php

namespace App\Services;

use App\Models\Otp;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    public $error = "";

    /**
     * Generate a new OTP and send it via email.
     */
    public function generate(string $email): bool
{
    // (1) Generate OTP
    $pass = "";
    $characters = "0123456789";
    for ($i = 0; $i < config('otp.length', 6); $i++) {
        $pass .= $characters[rand(0, strlen($characters) - 1)];
    }

    // (2) Store OTP in DB (hashed)
    Otp::updateOrCreate(
        ['email' => $email],
        ['pass' => bcrypt($pass), 'timestamp' => Carbon::now()]
    );

    try {
        // (3) Send using Laravel Mail (respects MAIL_MAILER=log)
        Mail::raw("Your OTP is $pass", function ($message) use ($email) {
            $message->to($email)
                    ->from(config('mail.from.address'), config('mail.from.name'))
                    ->subject('Barangay User REGISTRATION');
        });

        return true;
    } catch (\Exception $e) {
        $this->error = "Failed to log/send OTP email. Error: {$e->getMessage()}";
        return false;
    }
}

    /**
     * Verify OTP
     */
    public function verify(string $email, string $pass): bool
    {
        $otp = Otp::where('email', $email)->first();

        if (!$otp) {
            $this->error = "OTP not found.";
            return false;
        }

        // Expiry check
        $validMinutes = config('otp.validity', 15);
        if (Carbon::parse($otp->timestamp)->addMinutes($validMinutes)->isPast()) {
            $this->error = "OTP expired.";
            return false;
        }

        // Password check
        if (!password_verify($pass, $otp->pass)) {
            $this->error = "Incorrect OTP.";
            return false;
        }

        // Delete after success
        $otp->delete();
        return true;
    }
}
