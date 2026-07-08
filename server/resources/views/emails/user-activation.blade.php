<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Account Activation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width:600px; margin:auto; padding:20px;">

    <h2>Ethio Nordic Trading PLC Account Activation</h2>

    <p>Hello {{ $user->full_name }},</p>

    <p>Your account has been created. Please activate it by clicking the link below:</p>

    <p>
        <a href="{{ $activationUrl }}"
           style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">
           Activate Account
        </a>
    </p>

    <hr>

 

    <p>Regards,<br>Ethio Nordic Trading PLC Team</p>

</body>
</html>