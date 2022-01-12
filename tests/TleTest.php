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
        self::assertEquals('Tle', $response['@type']);
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

    public function testTleCollectionExtra(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'extra' => 1,
                'search' => 22049,
            ]
        );

        $response = $this->toArray($response);

        self::assertArrayHasKey('extra', $response['member'][0]);
    }

    public function testFloatFilter(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'extra' => 1,
                'eccentricity[gt]' => .2,
            ]
        );

        $response = $this->toArray($response);

        self::assertEquals(.2, $response['parameters']['eccentricity[gt]']);
        self::assertGreaterThan(.2, $response['member'][0]['extra']['eccentricity']);
    }

    public function testInvalidFloatFilterOperator(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'eccentricity[=>]' => .2,
            ]
        );

        $response = $this->toArray($response);

        self::assertEquals("Operator for filter 'eccentricity' should be one of the following gt, gte, lt, lte, '=>' provided", $response['response']['message']);
    }

    public function testArrayFilter(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'satellite_id[]' => 22049,
            ]
        );

        $response = $this->toArray($response);

        self::assertEquals(22049, $response['member'][0]['satelliteId']);
    }

    public function testArrayInvalidFilter(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'satellite_id' => 22049,
            ]
        );

        self::assertEquals(Response::HTTP_INTERNAL_SERVER_ERROR, $response->getStatusCode());

        $response = $this->toArray($response);

        self::assertEquals('Filter satellite_id value should be array', $response['response']['message']);
    }

    public function testCollectionSortEccentricity(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'sort' => 'eccentricity',
                'sort-dir' => 'desc',
            ]
        );

        $response = $this->toArray($response);

        self::assertEquals('eccentricity', $response['parameters']['sort']);
        self::assertEquals('desc', $response['parameters']['sort-dir']);
    }

    public function testCollectionSortPeriod(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'sort' => 'period',
                'sort-dir' => 'desc',
            ]
        );

        $response = $this->toArray($response);

        self::assertEquals('period', $response['parameters']['sort']);
        self::assertEquals('desc', $response['parameters']['sort-dir']);
    }

    public function testCollectionSortSemiMajorAxis(): void
    {
        $response = $this->get(
            '/api/tle/',
            [
                'sort' => 'semi_major_axis',
                'sort-dir' => 'desc',
            ]
        );

        $response = $this->toArray($response);

        self::assertEquals('semi_major_axis', $response['parameters']['sort']);
        self::assertEquals('desc', $response['parameters']['sort-dir']);
    }
}
