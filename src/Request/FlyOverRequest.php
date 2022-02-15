<?php

namespace App\Request;

use App\ViewModel\Observer;
use Ivanstan\SymfonySupport\Request\AbstractRequest;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class FlyOverRequest extends TleRequest
{
    use DateTimeDependantRequest;

    public function filterVisible(): bool {
        return (bool)$this->get('only_visible', true);
    }

    public function getObserver(): Observer
    {
        try {
            return new Observer(
                (float)$this->get('latitude', 0),
                (float)$this->get('longitude', 0),
                0,
                $this->getDateTime(),
            );
        } catch (\InvalidArgumentException $exception) {
            throw new BadRequestHttpException($exception->getMessage());
        }
    }
}
