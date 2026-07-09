<?php

namespace App\Services\Audit;

use Illuminate\Database\Eloquent\Model;

class AuditDataFilter
{
    protected array $hiddenAttributes;

    public function __construct()
    {
        $this->hiddenAttributes = config('audit.hidden_attributes', []);
    }

    /**
     * Filter attributes to remove sensitive fields.
     */
    public function filter(array|Model $data): array
    {
        if ($data instanceof Model) {
            $data = $data->getAttributes();
        }

        foreach ($this->hiddenAttributes as $hidden) {
            unset($data[$hidden]);
        }

        return $data;
    }

    /**
     * Check if a specific attribute should be hidden.
     */
    public function isHidden(string $attribute): bool
    {
        return in_array($attribute, $this->hiddenAttributes);
    }
}
