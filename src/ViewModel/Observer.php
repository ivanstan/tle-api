<?php

namespace App\ViewModel;

class Observer extends LatLng
{
    public \DateTime $datetime;

    public function __construct(float $latitude, float $longitude, public $altitude = 0, ?\DateTime $dateTime = null)
    {
        parent::__construct($latitude, $longitude);

        $this->datetime = $dateTime ?? new \DateTime('now', new \DateTimeZone($this->getTimeZone()));
    }
}
