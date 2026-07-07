<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Two-Factor Authentication Setup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #16a34a;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .qr-box {
            background-color: #fff;
            border: 2px solid #16a34a;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .code-box {
            background-color: #fff;
            border: 2px solid #2563eb;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .recovery-codes {
            background-color: #fff;
            border: 2px solid #dc2626;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .recovery-code {
            background: #f3f4f6;
            padding: 8px 12px;
            margin: 5px;
            display: inline-block;
            border-radius: 3px;
            font-family: monospace;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
        }
        .step {
            background-color: #fff;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #16a34a;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Two-Factor Authentication Setup</h1>
    </div>
    
    <div class="content">
        <h2>Hello {{ $user->full_name }},</h2>
        
        <p>Two-Factor Authentication (2FA) has been enabled for your account. This adds an extra layer of security to protect your account.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <h3>Setup Instructions:</h3>
        
        <div class="step">
            <strong>Step 1:</strong> Download an authenticator app on your smartphone (if you haven't already):
            <ul style="margin: 10px 0;">
                <li>Google Authenticator (iOS/Android)</li>
                <li>Microsoft Authenticator (iOS/Android)</li>
                <li>Authy (iOS/Android)</li>
            </ul>
        </div>
        
        <div class="step">
            <strong>Step 2:</strong> Scan the QR code below with your authenticator app:
        </div>
        
        <div class="qr-box">
            <img src="{{ $qrCodeUrl }}" alt="2FA QR Code" style="max-width: 250px;">
        </div>
        
        <div class="step">
            <strong>Step 3:</strong> Or manually enter this code in your authenticator app:
        </div>
        
        <div class="code-box">
            <p style="margin: 0;"><strong>Manual Entry Code:</strong></p>
            <p style="font-family: monospace; font-size: 18px; letter-spacing: 2px; color: #2563eb; margin: 10px 0;">
                {{ $manualEntryCode }}
            </p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div class="warning">
            <strong>⚠️ CRITICAL - Save Your Recovery Codes:</strong><br>
            Store these recovery codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
        </div>
        
        <div class="recovery-codes">
            <h3 style="color: #dc2626; margin-top: 0;">🔑 Recovery Codes</h3>
            <p style="font-size: 14px; margin-bottom: 15px;">Each code can only be used once:</p>
            <div style="text-align: center;">
                @foreach($recoveryCodes as $code)
                    <span class="recovery-code">{{ $code }}</span>
                @endforeach
            </div>
        </div>
        
        <div class="warning">
            <strong>Security Tips:</strong>
            <ul style="margin: 10px 0;">
                <li>Never share your 2FA codes with anyone</li>
                <li>Store recovery codes in a secure password manager or safe location</li>
                <li>Do not take screenshots of recovery codes on your phone</li>
                <li>Print this email and store it securely, or write down the codes</li>
            </ul>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <h3>What Happens Next:</h3>
        <ol>
            <li>Every time you log in, you'll be asked to enter a 6-digit code from your authenticator app</li>
            <li>The code changes every 30 seconds for maximum security</li>
            <li>If you lose your phone, use one of the recovery codes above</li>
        </ol>
        
        <p>If you did not request 2FA setup or have any questions, please contact your system administrator immediately.</p>
        
        <p>Best regards,<br>
        <strong>Ethio Nordic Trading PLC Team</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} Ethio Nordic Trading PLC. All rights reserved.</p>
    </div>
</body>
</html>
