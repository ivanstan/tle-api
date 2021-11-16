<?php

namespace App\Request;

trait TleRequestTrait
{
    public function getExtra(): bool
    {
        return (bool)$this->get(TleRequest::EXTRA_PARAM, false);
    }
}
