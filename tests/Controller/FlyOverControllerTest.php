<?php

namespace App\Tests\Controller;

use App\DataFixtures\TleFixtures;
use App\Tests\AbstractWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class FlyOverControllerTest extends AbstractWebTestCase
{
    public function testFlyOverForSatellite(): array
    {
        $tle = TleFixtures::create();

        $date = (new \DateTime())->format(\DateTimeInterface::ATOM);

        $response = $this->get(
            '/api/tle/'.$tle->getId().'/flyover',
            [
                'latitude' => 0,
                'longitude' => 0,
//                'date' => '2022-01-09T18:16:04+00:00'
            ]
        );

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals(
            [
                '@type' => 'Observer',
                'timezone' => 'UTC',
                'date' => $date,
                'altitude' => 0,
                'latitude' => 0,
                'longitude' => 0,
            ],
            $response['observer']
        );

        // ToDo: additional assertions

        return $response;
    }

    /**
     * @depends testFlyOverForSatellite
     */
    public function testFlyOverDetails(array $data): void
    {
        $response = $this->get($data['member'][0]['@id']);

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        // ToDo: additional assertions
    }
}
