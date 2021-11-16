<?php

namespace App\Request;

interface ValidatedRequestInterface
{
    public function validate(): void;
}
