<?php

namespace App\Service;

class DateTimeService
{
    public const UTC_TIMEZONE_NAME = 'UTC';

    public static function getCurrentUTC(): \DateTime
    {
        return new \DateTime('now', new \DateTimeZone(self::UTC_TIMEZONE_NAME));
    }
}
