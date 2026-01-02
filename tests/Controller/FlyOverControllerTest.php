<?php

namespace App\Tests\Controller;

use App\DataFixtures\TleFixtures;
use App\Tests\AbstractWebTestCase;
use App\Tests\AssertionTrait;
use Symfony\Component\HttpFoundation\Response;

class FlyOverControllerTest extends AbstractWebTestCase
{
    use AssertionTrait;

    public function testFlyOverForSatellite(): array
    {
        $tle = TleFixtures::create();

        $response = $this->get(
            '/api/tle/'.$tle->getId().'/flyover',
            [
                'latitude' => 45,
                'longitude' => 0,
                'date' => '2022-01-11T00:00:00+00:00',
            ]
        );

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);
        self::assertEquals(
            'http://localhost/api/tle/43550/flyover?latitude=45&longitude=0&only_visible=1&date=2022-01-11T00:00:00%2B00:00',
            $response['@id']
        );
        self::assertEquals('SatelliteFlyOverCollection', $response['@type']);

        $this->assertObserverCorrect(
            [
                'timezone' => 'Europe/Andorra',
                'date' => '2022-01-11T00:00:00+00:00',
                'latitude' => 45,
                'longitude' => 0,
            ],
            $response['observer']
        );

        $this->assertTle($tle, $response['tle']);

        self::assertEquals(
            [
                [
                    '@id' => 'http://localhost/api/tle/43550/flyover/1?latitude=45&longitude=0&only_visible=1&date=2022-01-11T00:00:00%2B00:00',
                    '@type' => 'SatelliteFlyOver',
                    'aos' => [
                        'date' => '2022-01-12T07:55:40+01:00',
                        'azimuth' => 165.39,
                        'elevation' => 11.43,
                    ],
                    'max' => [
                        'date' => '2022-01-12T07:56:14+01:00',
                        'azimuth' => 140.13,
                        'elevation' => 13.02,
                    ],
                    'los' => [
                        'date' => '2022-01-12T07:56:49+01:00',
                        'azimuth' => 115.18,
                        'elevation' => 11.3,
                    ],
                ],
                [
                    '@id' => 'http://localhost/api/tle/43550/flyover/2?latitude=45&longitude=0&only_visible=1&date=2022-01-11T00:00:00%2B00:00',
                    '@type' => 'SatelliteFlyOver',
                    'aos' => [
                        'date' => '2022-01-15T07:22:39+01:00',
                        'azimuth' => 143.3,
                        'elevation' => 58.7,
                    ],
                    'max' => [
                        'date' => '2022-01-15T07:22:39+01:00',
                        'azimuth' => 58.7,
                        'elevation' => 58.7,
                    ],
                    'los' => [
                        'date' => '2022-01-15T07:23:53+01:00',
                        'azimuth' => 67.42,
                        'elevation' => 12.3,
                    ],
                ],
                [
                    '@id' => 'http://localhost/api/tle/43550/flyover/3?latitude=45&longitude=0&only_visible=1&date=2022-01-11T00:00:00%2B00:00',
                    '@type' => 'SatelliteFlyOver',
                    'aos' => [
                        'date' => '2022-01-17T07:30:30+01:00',
                        'azimuth' => 13.11,
                        'elevation' => 15.04,
                    ],
                    'max' => [
                        'date' => '2022-01-17T07:30:30+01:00',
                        'azimuth' => 15.04,
                        'elevation' => 15.04,
                    ],
                    'los' => [
                        'date' => '2022-01-17T07:30:48+01:00',
                        'azimuth' => 24.33,
                        'elevation' => 12.23,
                    ],
                ],
            ],
            $response['member']
        );

        self::assertEquals(
            [
                'latitude' => 45,
                'longitude' => 0,
                'only_visible' => true,
                'date' => '2022-01-11T00:00:00+00:00',
                'satelliteId' => 43550,
            ],
            $response['parameters']
        );

        return $response;
    }

    #[\PHPUnit\Framework\Attributes\Depends('testFlyOverForSatellite')]
    public function testFlyOverDetails(array $data): void
    {
        $response = $this->get($data['member'][0]['@id']);

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);
        self::assertEquals(
            'http://localhost/api/tle/43550/flyover/1?latitude=45&longitude=0&only_visible=1&date=2022-01-11T00:00:00%2B00:00',
            $response['@id']
        );

        $this->assertObserverCorrect(
            [
                'timezone' => 'Europe/Andorra',
                'date' => '2022-01-11T00:00:00+00:00',
                'latitude' => 45,
                'longitude' => 0,
            ],
            $response['observer']
        );

        $this->assertTle(TleFixtures::create(), $response['tle']);

        self::assertEquals('SatelliteFlyOverDetails', $response['@type']);
        self::assertEquals(
            [
                'date' => '2022-01-12T07:55:40+01:00',
                'azimuth' => 165.39,
                'elevation' => 11.43,
            ],
            $response['aos']
        );
        self::assertEquals(
            [
                'date' => '2022-01-12T07:56:14+01:00',
                'azimuth' => 140.13,
                'elevation' => 13.02,
            ],
            $response['max']
        );
        self::assertEquals(
            [
                'date' => '2022-01-12T07:56:49+01:00',
                'azimuth' => 115.18,
                'elevation' => 11.3,
            ],
            $response['los']
        );

        $expectedDetails = [
            ['azimuth' => 207.65669959435, 'elevation' => 0.0047869592920753],
            ['azimuth' => 205.38477921994, 'elevation' => 1.0912635294549],
            ['azimuth' => 202.65595508189, 'elevation' => 2.2651771539291],
            ['azimuth' => 199.33469704804, 'elevation' => 3.5438021529901],
            ['azimuth' => 195.23705191884, 'elevation' => 4.9443077838983],
            ['azimuth' => 190.11679092622, 'elevation' => 6.4773095713303],
            ['azimuth' => 183.65932836183, 'elevation' => 8.1311877732861],
            ['azimuth' => 175.50942605954, 'elevation' => 9.8398778133251],
            ['azimuth' => 165.38832703269, 'elevation' => 11.433463880821],
            ['azimuth' => 153.35761135124, 'elevation' => 12.609105694977],
            ['azimuth' => 140.12610595023, 'elevation' => 13.022338671373],
            ['azimuth' => 126.98711086195, 'elevation' => 12.525560688957],
            ['azimuth' => 115.18410828561, 'elevation' => 11.301953434457],
            ['azimuth' => 105.33145147768, 'elevation' => 9.7004916046037],
            ['azimuth' => 97.426469426974, 'elevation' => 8.0082733487551],
            ['azimuth' => 91.16864583908, 'elevation' => 6.3798579196494],
            ['azimuth' => 86.20406033951, 'elevation' => 4.8728059546152],
            ['azimuth' => 82.226671257738, 'elevation' => 3.4953715898431],
            ['azimuth' => 78.999104073798, 'elevation' => 2.2361396455495],
            ['azimuth' => 76.344581280163, 'elevation' => 1.0781611811795],
        ];

        self::assertCount(count($expectedDetails), $response['details']);
        foreach ($expectedDetails as $i => $expected) {
            self::assertEqualsWithDelta($expected['azimuth'], $response['details'][$i]['azimuth'], 0.0001);
            self::assertEqualsWithDelta($expected['elevation'], $response['details'][$i]['elevation'], 0.0001);
        }
    }

    public function testLatitudeAbove90(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get(
            '/api/tle/'.$tle->getId().'/flyover',
            [
                'latitude' => 100,
                'longitude' => 0,
            ]
        );

        self::assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('Invalid latitude value', $response['response']['message']);
    }

    public function testLatitudeBellow90(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get(
            '/api/tle/'.$tle->getId().'/flyover',
            [
                'latitude' => -100,
                'longitude' => 0,
            ]
        );

        self::assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('Invalid latitude value', $response['response']['message']);
    }

    public function testLongitudeAbove180(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get(
            '/api/tle/'.$tle->getId().'/flyover',
            [
                'latitude' => 0,
                'longitude' => 190,
            ]
        );

        self::assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('Invalid longitude value', $response['response']['message']);
    }

    public function testLongitudeBellow180(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get(
            '/api/tle/'.$tle->getId().'/flyover',
            [
                'latitude' => 0,
                'longitude' => -190,
            ]
        );

        self::assertEquals(Response::HTTP_BAD_REQUEST, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('Invalid longitude value', $response['response']['message']);
    }
}
