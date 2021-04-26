<?php


namespace App\Tests;


use App\DataFixtures\TleFixtures;
use Symfony\Component\HttpFoundation\Response;

class PropagateControllerTest extends AbstractWebTestCase
{
    public function testPropagate(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get('/api/tle/' . $tle->getId() . '/propagate', [
            'date' => '2021-04-26T17:49:45+02:00'
        ]);

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals($response['@context'], 'https://www.w3.org/ns/hydra/context.jsonld');
        self::assertEquals($response['@id'], 'http://localhost/api/tle/43550/propagate?date=2021-04-26T17:49:45%2B02:00');
        self::assertEquals($response['@type'], 'SatellitePropagationResult');

        self::assertArrayHasKey('tle', $response);

        self::assertEquals($response['algorithm'], 'SGP4');

        self::assertEquals($response['vector']['reference_frame'], 'ECI');

        self::assertEquals($response['vector']['position']['x'], 3731.3677738358);
        self::assertEquals($response['vector']['position']['y'], -3929.0247024138);
        self::assertEquals($response['vector']['position']['z'], -3820.6175474185);
        self::assertEquals($response['vector']['position']['r'], 6630.0421581948);
        self::assertEquals($response['vector']['position']['unit'], 'km');

        self::assertEquals($response['vector']['velocity']['x'], 2.2692661551689);
        self::assertEquals($response['vector']['velocity']['y'], 6.1586427245624);
        self::assertEquals($response['vector']['velocity']['z'], -4.1239106928913);
        self::assertEquals($response['vector']['velocity']['r'], 7.7514571852487);
        self::assertEquals($response['vector']['velocity']['unit'], 'km/s');

        self::assertEquals($response['geodetic']['latitude'], -35.362152001955);
        self::assertEquals($response['geodetic']['longitude'], 221.21616992358);
        self::assertEquals($response['geodetic']['altitude'], 259.03105001661);

        self::assertEquals($response['parameters']['satelliteId'], 43550);
        self::assertEquals($response['parameters']['date'], '2021-04-26T17:49:45+02:00');
    }
}
