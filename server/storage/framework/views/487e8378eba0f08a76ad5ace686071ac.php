<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Account Activation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width:600px; margin:auto; padding:20px;">

    <h2>Ethio Nordic ERP Account Activation</h2>

    <p>Hello <?php echo e($user->full_name); ?>,</p>

    <p>Your account has been created. Please activate it by clicking the link below:</p>

    <p>
        <a href="<?php echo e($activationUrl); ?>"
           style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">
           Activate Account
        </a>
    </p>

    <hr>

    <p style="font-size:12px;color:#777;">
        If you did not request this account, please ignore this email.
    </p>

    <p>Regards,<br>Ethio Nordic ERP Team</p>

</body>
</html><?php /**PATH /var/www/resources/views/emails/user-activation.blade.php ENDPATH**/ ?>