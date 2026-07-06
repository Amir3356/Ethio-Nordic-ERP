<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Activation</title>
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
            background-color: #2563eb;
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
        .credentials-box {
            background-color: #fff;
            border: 2px solid #2563eb;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials-box strong {
            color: #2563eb;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Ethio Nordic ERP</h1>
    </div>
    
    <div class="content">
        <h2>Hello <?php echo e($user->full_name); ?>,</h2>
        
        <p>Your account has been created successfully! We're excited to have you on board.</p>
        
        <div class="credentials-box">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> <?php echo e($user->email); ?></p>
            <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 5px 10px; border-radius: 3px;"><?php echo e($temporaryPassword); ?></code></p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This temporary password will expire in 7 days. You must activate your account and set a new password before then.
        </div>
        
        <p>To activate your account and set up your permanent password, please click the button below:</p>
        
        <center>
            <a href="<?php echo e($activationUrl); ?>" class="button">Activate Your Account</a>
        </center>
        
        <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="<?php echo e($activationUrl); ?>"><?php echo e($activationUrl); ?></a></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <h3>Next Steps:</h3>
        <ol>
            <li>Click the activation link above</li>
            <li>Set your permanent password</li>
            <li>Enable Two-Factor Authentication (2FA) for enhanced security</li>
            <li>Complete your profile information</li>
        </ol>
        
        <p>If you did not request this account or have any questions, please contact your system administrator immediately.</p>
        
        <p>Best regards,<br>
        <strong>Ethio Nordic ERP Team</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; <?php echo e(date('Y')); ?> Ethio Nordic ERP. All rights reserved.</p>
    </div>
</body>
</html>
<?php /**PATH C:\Users\hp\Desktop\Ethio-Nordic-ERP\server\resources\views/emails/user-activation.blade.php ENDPATH**/ ?>