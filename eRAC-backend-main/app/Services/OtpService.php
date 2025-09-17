<?php

namespace App\Services;

use App\Models\Otp;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Carbon\Carbon;

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

        // for ($i = 0; $i < config('otp.length', 6); $i++) {
        //     $pass .= $characters[rand(0, strlen($characters) - 1)];
        // }
        $pass = "000000";

        // (2) Store OTP in DB (hashed)
        Otp::updateOrCreate(
            ['email' => $email],
            [
                'pass'      => bcrypt($pass),
                'timestamp' => Carbon::now(),
            ]
        );

        // (3) Send via PHPMailer
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'mahusayjograd@gmail.com'; // SMTP username
            $mail->Password   = 'mfdp feje aill bgcy'; // SMTP password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            //Recipients
            $mail->setFrom('mahusayjograd@gmail.com', 'eRACS WEB APP');
            $mail->addAddress($email);
            $mail->addAddress($email);

            $mail->isHTML(true);
            $mail->Subject = 'eRACS REGISTRATION';
            $mail->Body    = "Your OTP is <b>$pass</b>. Enter at <a href='" . url('/challenge') . "'>eRACS</a>.";
            $mail->AltBody = "Your OTP is $pass. Enter at " . url('/challenge');

            $mail->send();
            return true;
        } catch (Exception $e) {
            $this->error = "Failed to send OTP email. Mailer Error: {$mail->ErrorInfo}";
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
