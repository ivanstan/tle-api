<?php

namespace App\ViewModel;

class Observer extends LatLng
{
    public \DateTime $date;

    /**
     * @throws \Exception
     */
    public function __construct(float $latitude, float $longitude, public $altitude = 0, ?\DateTime $dateTime = null)
    {
        parent::__construct($latitude, $longitude);

        $this->date = $dateTime ?? new \DateTime('now', new \DateTimeZone($this->getTimezone()));
    }
}
