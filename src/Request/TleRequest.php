<?php

namespace App\Request;

class TleRequest extends AbstractRequest
{
    public const EXTRA_PARAM = 'extra';

    use TleRequestTrait;

    public function getId(): int
    {
        return $this->attributes->get('id');
    }

    public function validate(): void
    {
        $this->assertParamIsBoolean($this, self::EXTRA_PARAM);
    }
}
