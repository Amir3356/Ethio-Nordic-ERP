<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
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
            background-color: #dc2626;
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
        .button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .credentials-box {
            background-color: #fff;
            border: 2px solid #dc2626;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
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
        .security-notice {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>
    
    <div class="content">
        <h2>Hello {{ $user->full_name }},</h2>
        
        <p>We received a request to reset the password for your Ethio Nordic ERP account.</p>
        
        @if($temporaryPassword)
        <div class="credentials-box">
            <h3>Your Temporary Password:</h3>
            <p><code style="background: #e5e7eb; padding: 5px 10px; border-radius: 3px; font-size: 16px;">{{ $temporaryPassword }}</code></p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This temporary password will expire in 7 days. Please log in and change it immediately.
        </div>
        @else
        <p>To reset your password, please click the button below:</p>
        
        <center>
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </center>
        
        <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ $resetUrl }}">{{ $resetUrl }}</a></p>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This password reset link will expire in 60 minutes for security reasons.
        </div>
        @endif
        
        <div class="security-notice">
            <strong>🔒 Security Notice:</strong>
            <ul style="margin: 10px 0;">
                <li>If you did not request this password reset, please ignore this email and contact your system administrator immediately.</li>
                <li>Your current password will remain active until you complete the reset process.</li>
                <li>For your security, we recommend using a strong, unique password.</li>
            </ul>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <h3>Password Requirements:</h3>
        <ul>
            <li>Minimum 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
        </ul>
        
        <p>If you have any questions or concerns, please contact your system administrator.</p>
        
        <p>Best regards,<br>
        <strong>Ethio Nordic ERP Team</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} Ethio Nordic ERP. All rights reserved.</p>
    </div>
</body>
</html>
