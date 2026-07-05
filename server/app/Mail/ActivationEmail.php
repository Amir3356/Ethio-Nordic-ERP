<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ActivationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $activationToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Activate Your Account - Ethio Nordic ERP',
        );
    }

    public function content(): Content
    {
        $activationUrl = config('app.frontend_url', 'http://localhost:5173') . '/activate?token=' . $this->activationToken;

        return new Content(
            htmlString: $this->buildHtml($activationUrl),
        );
    }

    private function buildHtml(string $activationUrl): string
    {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6f9;">
            <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1a1f36,#2d3561);padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Ethio Nordic ERP</h1>
                </div>
                <div style="padding:36px 32px;">
                    <h2 style="color:#1a1f36;margin:0 0 16px;font-size:20px;">Welcome, ' . htmlspecialchars($this->user->full_name) . '!</h2>
                    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 8px;">
                        Your account has been created by an administrator. Click the button below to activate your account and set your password.
                    </p>
                    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 28px;">
                        This activation link will expire in <strong>48 hours</strong>.
                    </p>
                    <div style="text-align:center;margin:0 0 28px;">
                        <a href="' . $activationUrl . '" style="display:inline-block;padding:14px 36px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                            Activate Account
                        </a>
                    </div>
                    <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0 0 8px;">
                        If the button does not work, copy and paste this link into your browser:
                    </p>
                    <p style="color:#4f46e5;font-size:13px;word-break:break-all;margin:0;">
                        ' . $activationUrl . '
                    </p>
                </div>
                <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                        If you did not expect this email, please ignore it or contact your administrator.
                    </p>
                </div>
            </div>
        </body>
        </html>';
    }
}
