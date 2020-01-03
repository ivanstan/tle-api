<?php

namespace App\Tests;

use App\DataFixtures\TleFixtures;

final class TleTest extends AbstractWebTestCase
{
    public function testTleSingleRecord(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get('/api/tle/'.$tle->getId());

        self::assertEquals(200, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertArrayHasKey('@id', $response);
        self::assertArrayHasKey('@type', $response);
        self::assertArrayHasKey('name', $response);
        self::assertArrayHasKey('date', $response);
        self::assertArrayHasKey('line1', $response);
        self::assertArrayHasKey('line2', $response);

        self::assertEquals('http://localhost/api/tle/'.$tle->getId(), $response['@id']);
        self::assertEquals('TleModel', $response['@type']);
        self::assertEquals($tle->getName(), $response['name']);
        self::assertEquals(TleFixtures::$date, $response['date']);
        self::assertEquals($tle->getLine1(), $response['line1']);
        self::assertEquals($tle->getLine2(), $response['line2']);
    }

    public function testTleCollectionRecord(): void
    {
        $pageSize = 2;

        $response = $this->get(
            '/api/tle',
            [
                'page-size' => $pageSize,
            ]
        );

        self::assertEquals(200, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertArrayHasKey('@context', $response);
        self::assertEquals($response['@context'], 'http://www.w3.org/ns/hydra/context.jsonld');

        self::assertArrayHasKey('@id', $response);
        self::assertEquals($response['@id'], 'http://localhost/api/tle');

        self::assertArrayHasKey('@type', $response);
        self::assertEquals($response['@type'], 'Collection');

        self::assertArrayHasKey('totalItems', $response);
        self::assertEquals($response['totalItems'], 10);

        self::assertArrayHasKey('member', $response);
        self::assertEquals(\count($response['member']), $pageSize);

        self::assertArrayHasKey('parameters', $response);
        $parameters = $response['parameters'];

        self::assertArrayHasKey('search', $parameters);
        self::assertEquals($parameters['search'], '*');

        self::assertArrayHasKey('sort', $parameters);
        self::assertEquals($parameters['sort'], 'name');

        self::assertArrayHasKey('sort-dir', $parameters);
        self::assertEquals($parameters['sort-dir'], 'asc');

        self::assertArrayHasKey('page', $parameters);
        self::assertEquals($parameters['page'], 1);

        self::assertArrayHasKey('page-size', $parameters);
        self::assertEquals($parameters['page-size'], $pageSize);
    }
}
