<?php

namespace App\Enum;

class TleFilterFieldsEnum
{
    // Orbit type filters
    public const GEOSTATIONARY_ORBIT = 'geostationaryOrbit';
    public const GEOSYNCHRONOUS_ORBIT = 'geosynchronousOrbit';
    public const CIRCULAR_ORBIT = 'circularOrbit';
    public const ELLIPTICAL_ORBIT = 'ellipticalOrbit';
    public const LOW_EARTH_ORBIT = 'lowEarthOrbit';
    public const MEDIUM_EARTH_ORBIT = 'mediumEarthOrbit';
    public const HIGH_EARTH_ORBIT = 'highEarthOrbit';
    public const POLAR_ORBIT = 'polarOrbit';
    public const SUN_SYNCHRONOUS_ORBIT = 'sunSynchronousOrbit';
    public const MOLNIYA_ORBIT = 'molniyaOrbit';
    public const TUNDRA_ORBIT = 'tundraOrbit';
    public const CRITICAL_INCLINATION_ORBIT = 'criticalInclinationOrbit';
    public const POSIGRADE_ORBIT = 'posigradeOrbit';
    public const RETROGRADE_ORBIT = 'retrogradeOrbit';
    public const DECAYING_ORBIT = 'decayingOrbit';
    public const LOW_DRAG = 'lowDrag';

    // Classification filters
    public const CLASSIFIED_SATELLITE = 'classifiedSatellite';
    public const UNCLASSIFIED_SATELLITE = 'unclassifiedSatellite';
    public const RECENT_TLE = 'recentTle';
}

