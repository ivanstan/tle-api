<?php

namespace App\Request;

use Ivanstan\SymfonySupport\Services\DateTimeService;

trait DateTimeDependantRequest
{
    public function getDateTime(string $name = 'date'): \DateTime
    {
        $date = $this->get($name, DateTimeService::getCurrentUTC()->format(\DateTimeInterface::ATOM));

        return \DateTime::createFromFormat(\DateTimeInterface::ATOM, str_replace(' ', '+', $date));
    }
}
