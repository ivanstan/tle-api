<?php

namespace App\Tests;

use App\DataFixtures\TleFixtures;
use Symfony\Component\HttpFoundation\Response;

final class TleTest extends AbstractWebTestCase
{
    public function testTleSingleRecord(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get('/api/tle/' . $tle->getId());

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertArrayHasKey('@id', $response);
        self::assertArrayHasKey('@type', $response);
        self::assertArrayHasKey('name', $response);
        self::assertArrayHasKey('date', $response);
        self::assertArrayHasKey('line1', $response);
        self::assertArrayHasKey('line2', $response);

        self::assertEquals('http://localhost/api/tle/' . $tle->getId(), $response['@id']);
        self::assertEquals('TleModel', $response['@type']);
        self::assertEquals($tle->getName(), $response['name']);
        self::assertEquals(TleFixtures::$date, $response['date']);
        self::assertEquals($tle->getLine1(), $response['line1']);
        self::assertEquals($tle->getLine2(), $response['line2']);
    }

    public function testTleRecordNotFound(): void
    {
        $response = $this->get('/api/tle/0');
        self::assertEquals(Response::HTTP_NOT_FOUND, $response->getStatusCode());
    }

    public function testTleCollectionRecord(): void
    {
        $pageSize = 2;

        $response = $this->get(
            '/api/tle/',
            [
                'page-size' => $pageSize,
            ]
        );

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertArrayHasKey('@context', $response);
        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);

        self::assertArrayHasKey('@id', $response);
        self::assertEquals('http://localhost/api/tle/', $response['@id']);

        self::assertArrayHasKey('@type', $response);
        self::assertEquals('Tle[]', $response['@type']);

        self::assertArrayHasKey('totalItems', $response);
        self::assertEquals(11, $response['totalItems']);

        self::assertArrayHasKey('member', $response);
        self::assertEquals(\count($response['member']), $pageSize);

        self::assertArrayHasKey('parameters', $response);
        $parameters = $response['parameters'];

        self::assertArrayHasKey('search', $parameters);
        self::assertEquals('*', $parameters['search']);

        self::assertArrayHasKey('sort', $parameters);
        self::assertEquals('popularity', $parameters['sort']);

        self::assertArrayHasKey('sort-dir', $parameters);
        self::assertEquals('desc', $parameters['sort-dir']);

        self::assertArrayHasKey('page', $parameters);
        self::assertEquals(1, $parameters['page']);

        self::assertArrayHasKey('page-size', $parameters);
        self::assertEquals($parameters['page-size'], $pageSize);
    }
}
