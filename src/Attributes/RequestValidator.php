<?php

namespace App\Attributes;

#[\Attribute(\Attribute::TARGET_METHOD)]
class RequestValidator
{
    public function __construct(protected array $validations)
    {
    }
}
