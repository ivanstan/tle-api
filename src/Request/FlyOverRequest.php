<?php

namespace App\Request;

use Ivanstan\SymfonySupport\Request\AbstractRequest;

class FlyOverRequest extends AbstractRequest
{
    use DateTimeDependantRequest;

    public function filterVisible(): bool {
        return (bool)$this->get('only_visible', true);
    }
}
