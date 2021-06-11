<?php

namespace App\Tests\Controller;

use App\DataFixtures\TleFixtures;
use App\Tests\AbstractWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class PropagateControllerTest extends AbstractWebTestCase
{
    public function testResourceNotFound(): void
    {
        $response = $this->get('/api/tle/0/propagate');

        self::assertEquals(Response::HTTP_NOT_FOUND, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('Unable to find record with id 0', $response['response']['message']);
    }

    public function testPropagateSGP4(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get(
            '/api/tle/' . $tle->getId() . '/propagate',
            [
                'date' => '2021-04-26T17:49:45+02:00',
            ]
        );

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);
        self::assertEquals('http://localhost/api/tle/43550/propagate?date=2021-04-26T17:49:45%2B02:00', $response['@id']);
        self::assertEquals('SatellitePropagationResult', $response['@type']);

        self::assertArrayHasKey('tle', $response);

        self::assertEquals('SGP4', $response['algorithm']);

        self::assertEquals('ECI', $response['vector']['reference_frame']);

        self::assertEquals(3731.3677738358, $response['vector']['position']['x']);
        self::assertEquals(-3929.0247024138, $response['vector']['position']['y']);
        self::assertEquals(-3820.6175474185, $response['vector']['position']['z']);
        self::assertEquals(6630.0421581948, $response['vector']['position']['r']);
        self::assertEquals('km', $response['vector']['position']['unit']);

        self::assertEquals(2.2692661551689, $response['vector']['velocity']['x']);
        self::assertEquals(6.1586427245624, $response['vector']['velocity']['y']);
        self::assertEquals(-4.1239106928913, $response['vector']['velocity']['z']);
        self::assertEquals(7.7514571852487, $response['vector']['velocity']['r']);
        self::assertEquals('km/s', $response['vector']['velocity']['unit']);

        self::assertEquals(-35.362152001955, $response['geodetic']['latitude']);
        self::assertEquals(221.21616992358, $response['geodetic']['longitude']);
        self::assertEquals(259.03105001661, $response['geodetic']['altitude']);

        self::assertEquals(43550, $response['parameters']['satelliteId']);
        self::assertEquals('2021-04-26T17:49:45+02:00', $response['parameters']['date']);
    }

    public function testPropagateSDP4(): void
    {
        $tle = TleFixtures::createDeep();

        $response = $this->get(
            '/api/tle/' . $tle->getId() . '/propagate',
            [
                'date' => '2021-04-26T17:49:45+02:00',
            ]
        );

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);
        self::assertEquals('http://localhost/api/tle/22049/propagate?date=2021-04-26T17:49:45%2B02:00', $response['@id']);
        self::assertEquals('SatellitePropagationResult', $response['@type']);

        self::assertArrayHasKey('tle', $response);

        self::assertEquals('SDP4', $response['algorithm']);

        self::assertEquals('ECI', $response['vector']['reference_frame']);

        self::assertEquals(142825.54086031896, $response['vector']['position']['x']);
        self::assertEquals(133973.34798843606, $response['vector']['position']['y']);
        self::assertEquals(1303.6185230048, $response['vector']['position']['z']);
        self::assertEquals(195830.7751976863, $response['vector']['position']['r']);
        self::assertEquals('km', $response['vector']['position']['unit']);

        self::assertEquals(-0.51310326492624, $response['vector']['velocity']['x']);
        self::assertEquals(0.5491989174236, $response['vector']['velocity']['y']);
        self::assertEquals(0.60190735910381, $response['vector']['velocity']['z']);
        self::assertEquals(0.96290543685273, $response['vector']['velocity']['r']);
        self::assertEquals('km/s', $response['vector']['velocity']['unit']);

        self::assertEquals(0.38149611267203, $response['geodetic']['latitude']);
        self::assertEquals(310.86248495862, $response['geodetic']['longitude']);
        self::assertEquals(189452.64114393186, $response['geodetic']['altitude']);

        self::assertEquals(22049, $response['parameters']['satelliteId']);
        self::assertEquals('2021-04-26T17:49:45+02:00', $response['parameters']['date']);
    }
}
