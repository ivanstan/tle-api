<?php

namespace App\Tests;

use Symfony\Component\HttpFoundation\Response;

class StatisticsControllerTest extends AbstractWebTestCase
{
    public function testHits(): void
    {
        $response = $this->get('/api/tle/hits');

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());
    }
}
