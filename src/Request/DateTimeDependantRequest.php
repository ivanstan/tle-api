<?php

namespace App\Request;

use Ivanstan\SymfonySupport\Request\AbstractRequest;
use Ivanstan\SymfonySupport\Services\DateTimeService;

class DateTimeDependantRequest extends AbstractRequest
{
    public function getDateTime(string $name = 'date'): \DateTime
    {
        $date = $this->get($name, DateTimeService::getCurrentUTC()->format(\DateTimeInterface::ATOM));

        return \DateTime::createFromFormat(\DateTimeInterface::ATOM, str_replace(' ', '+', $date));
    }
}
