<?php

namespace App\ViewModel;

use DateTimeZone;

class LatLng
{
    /**
     * @throws \InvalidArgumentException
     */
    public function __construct(public float $latitude, public float $longitude)
    {
        if ($this->latitude > 90 || $this->latitude < -90) {
            throw new \InvalidArgumentException('Invalid latitude value');
        }

        if ($this->longitude > 180 || $this->longitude < -180) {
            throw new \InvalidArgumentException('Invalid longitude value');
        }
    }

    public function getTimeZone(): ?string
    {
        $diffs = [];
        foreach (DateTimeZone::listIdentifiers() as $timezoneID) {
            $timezone = new DateTimeZone($timezoneID);
            $location = $timezone->getLocation();
            $tLat = $location['latitude'];
            $tLng = $location['longitude'];
            $diffLat = abs($this->latitude - $tLat);
            $diffLng = abs($this->longitude - $tLng);
            $diff = $diffLat + $diffLng;
            $diffs[$timezoneID] = $diff;
        }

        $timezone = array_keys($diffs, min($diffs));

        return $timezone[0] ?? null;
    }
}
