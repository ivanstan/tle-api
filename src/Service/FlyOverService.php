<?php

namespace App\Service;

use App\Entity\Tle;
use App\ViewModel\Observer;

class FlyOverService
{
    private \Predict $predict;
    private \Predict_QTH $qth;
    private \Predict_Sat $sat;

    public function __construct()
    {
        $this->predict = new \Predict();
        $this->qth = new \Predict_QTH();
    }

    public function setTle(Tle $tle): self
    {
        $this->sat = new \Predict_Sat(
            new \Predict_TLE($tle->getName(), $tle->getLine1(), $tle->getLine2())
        );

        return $this;
    }

    public function setObserver(Observer $observer): self
    {
        $this->qth->lat = $observer->latitude;
        $this->qth->lon = $observer->longitude;
        $this->qth->alt = $observer->altitude;

        return $this;
    }

    public function getPasses(\DateTime $date, bool $filterVisible): array
    {
        $this->predict->minEle = 10; // Minimum elevation for a pass
        $this->predict->timeRes = 10; // Pass details: time resolution in seconds
        $this->predict->numEntries = 20; // Pass details: number of entries per pass
        $this->predict->threshold = -6; // Twilight threshold (sun must be at this lat or lower)

        // Get the passes and filter visible only, takes about 4 seconds for 10 days
        $passes = $this->predict->get_passes($this->sat, $this->qth, \Predict_Time::unix2daynum($date->getTimestamp()), 10);

        if ($filterVisible) {
            return $this->predict->filterVisiblePasses($passes);
        }

        return $passes;
    }
}
