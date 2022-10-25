<?php

namespace App\Tests\Controller;

use App\Tests\AbstractWebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class CollectionTest extends AbstractWebTestCase
{
    private const TEST = [
        [
            'page' => 1,
            'expected' => [
                '@id' => 'http://localhost/api/tle/?page=1&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle/?page=1&page-size=2',
                'next' => 'http://localhost/api/tle/?page=2&page-size=2',
                'last' => 'http://localhost/api/tle/?page=6&page-size=2',
            ],
        ],
        [
            'page' => 3,
            'expected' => [
                '@id' => 'http://localhost/api/tle/?page=3&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle/?page=1&page-size=2',
                'previous' => 'http://localhost/api/tle/?page=2&page-size=2',
                'next' => 'http://localhost/api/tle/?page=4&page-size=2',
                'last' => 'http://localhost/api/tle/?page=6&page-size=2',
            ],
        ],
        [
            'page' => 5,
            'expected' => [
                '@id' => 'http://localhost/api/tle/?page=5&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle/?page=1&page-size=2',
                'previous' => 'http://localhost/api/tle/?page=4&page-size=2',
                'next' => 'http://localhost/api/tle/?page=6&page-size=2',
                'last' => 'http://localhost/api/tle/?page=6&page-size=2',
            ],
        ],
        [
            'page' => 7,
            'expected' => [
                '@id' => 'http://localhost/api/tle/?page=7&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle/?page=1&page-size=2',
                'previous' => 'http://localhost/api/tle/?page=6&page-size=2',
                'last' => 'http://localhost/api/tle/?page=6&page-size=2',
            ],
        ],
    ];

    public function testPaginationWorks(): void
    {
        foreach (self::TEST as $test) {
            $response = $this->getCollectionContent($test['page'], 2);

            self::assertArrayHasKey('view', $response);

            $this->assertViewIsCorrect(
                $test['expected'],
                $response['view']
            );
        }
    }

    public function testPaginationError(): void
    {
        $response = $this->getCollection(-1, 2);
        self::assertEquals(
            Response::HTTP_BAD_REQUEST,
            $response->getStatusCode(),
            'Assert HTTP 400 is returned for page -1'
        );

        $response = $this->getCollection(0, 2);
        self::assertEquals(
            Response::HTTP_BAD_REQUEST,
            $response->getStatusCode(),
            'Assert HTTP 400 is returned for page 0'
        );

        $response = $this->getCollection(1, -1);
        self::assertEquals(
            Response::HTTP_BAD_REQUEST,
            $response->getStatusCode(),
            'Assert HTTP 400 is returned for page size -1'
        );

        $response = $this->getCollection(1, 0);
        self::assertEquals(
            Response::HTTP_BAD_REQUEST,
            $response->getStatusCode(),
            'Assert HTTP 400 is returned for page size 0'
        );
    }

    private function assertViewIsCorrect($expected, $actual): void
    {
        foreach ($actual as $key => $value) {
            self::assertArrayHasKey($key, $expected, \sprintf('Assert view has key %s', $key));
            self::assertEquals($expected[$key], $value, \sprintf('Assert value of key %s is correct', $key));
        }
    }

    /** @noinspection PhpSameParameterValueInspection */
    private function getCollectionContent(int $page, int $pageSize): array
    {
        return $this->toArray(
            $this->getCollection($page, $pageSize)
        );
    }

    private function getCollection(int $page, int $pageSize): Response
    {
        return $this->get(
            '/api/tle/',
            [
                'page' => $page,
                'page-size' => $pageSize,
            ]
        );
    }
}
