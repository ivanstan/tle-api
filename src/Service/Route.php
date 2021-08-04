<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\Request;

class Route
{
    public const PRODUCTION_HOST = 'tle.ivanstanojevic.me';

    public static function inArray(Request $request, array $routes): bool
    {
        return in_array($request->get('_route'), $routes, false);
    }
}
