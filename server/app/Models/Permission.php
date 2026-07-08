<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use Auditable;

    protected $fillable = [
        'name',
        'slug',
        'module',
        'action',
        'description',
    ];

    /**
     * Get all roles that have this permission
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }
}

