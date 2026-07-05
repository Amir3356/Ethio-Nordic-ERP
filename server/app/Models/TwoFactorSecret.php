<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class TwoFactorSecret extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'secret',
        'is_enabled',
        'enabled_at',
        'recovery_codes',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'enabled_at' => 'datetime',
    ];

    protected $hidden = [
        'secret',
        'recovery_codes',
    ];

    /**
     * Get the user that owns the 2FA secret
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the decrypted secret
     */
    public function getDecryptedSecret(): string
    {
        return Crypt::decryptString($this->secret);
    }

    /**
     * Set the encrypted secret
     */
    public function setSecretAttribute($value)
    {
        $this->attributes['secret'] = Crypt::encryptString($value);
    }

    /**
     * Get the decrypted recovery codes
     */
    public function getDecryptedRecoveryCodes(): ?array
    {
        if (!$this->recovery_codes) {
            return null;
        }
        return json_decode(Crypt::decryptString($this->recovery_codes), true);
    }

    /**
     * Set the encrypted recovery codes
     */
    public function setRecoveryCodesAttribute($value)
    {
        if (is_array($value)) {
            $value = json_encode($value);
        }
        $this->attributes['recovery_codes'] = $value ? Crypt::encryptString($value) : null;
    }
}
