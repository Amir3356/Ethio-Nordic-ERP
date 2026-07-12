<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    use \App\Traits\Auditable;

    protected $table = 'chart_of_accounts';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'code', 'name', 'type', 'parent_id', 'currency', 'cost_center', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function journalLines()
    {
        return $this->hasMany(JournalLine::class, 'account_id');
    }
}
