<?php

namespace App\Request;

use Ivanstan\SymfonySupport\Services\DateTimeService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

trait DateTimeDependantRequest
{
    public function getDateTime(string $name = 'date'): \DateTime
    {
        $date = $this->get($name, DateTimeService::getCurrentUTC()->format(\DateTimeInterface::ATOM));

        $dateTime = \DateTime::createFromFormat(\DateTimeInterface::ATOM, str_replace(' ', '+', $date));
        
        if ($dateTime === false) {
            throw new BadRequestHttpException(\sprintf('Invalid date format for parameter "%s". Expected ATOM format (e.g., 2024-01-31T12:00:00+00:00), got: %s', $name, $date));
        }

        return $dateTime;
    }
}
