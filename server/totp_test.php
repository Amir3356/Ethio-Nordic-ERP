<?php
require __DIR__ . '/vendor/autoload.php';

echo "Current timestamp: " . time() . "\n";
echo "Expected for 2026-07-08 12:47:39 UTC: " . strtotime("2026-07-08 12:47:39 UTC") . "\n";
echo "Diff: " . (time() - strtotime("2026-07-08 12:47:39 UTC")) . " seconds\n";

$google2fa = new PragmaRX\Google2FA\Google2FA();
echo "Current 30s interval: " . $google2fa->getTimestamp() . "\n";

$secret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
$otp = $google2fa->getCurrentOtp($secret);
echo "Test OTP for 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567': " . $otp . "\n";

// Try another secret
$secret2 = 'NS2V' . str_repeat('A', 28);
$otp2 = $google2fa->getCurrentOtp($secret2);
echo "Test OTP for 'NS2V...': " . $otp2 . "\n";

echo "verifyKey (self-test): " . ($google2fa->verifyKey($secret, $otp, 8) ? "OK" : "FAIL") . "\n";
