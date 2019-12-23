<?php

namespace App\Tests;

final class CollectionTest extends AbstractWebTestCase
{
    private const TEST = [
        [
            'page' => 1,
            'expected' => [
                '@id' => 'http://localhost/api/tle?page=1&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle?page=1&page-size=2',
                'next' => 'http://localhost/api/tle?page=2&page-size=2',
                'last' => 'http://localhost/api/tle?page=5&page-size=2'
            ]
        ],
        [
            'page' => 3,
            'expected' => [
                '@id' => 'http://localhost/api/tle?page=3&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle?page=1&page-size=2',
                'previous' => 'http://localhost/api/tle?page=2&page-size=2',
                'next' => 'http://localhost/api/tle?page=4&page-size=2',
                'last' => 'http://localhost/api/tle?page=5&page-size=2'
            ]
        ],
        [
            'page' => 5,
            'expected' => [
                '@id' => 'http://localhost/api/tle?page=5&page-size=2',
                '@type' => 'PartialCollectionView',
                'first' => 'http://localhost/api/tle?page=1&page-size=2',
                'previous' => 'http://localhost/api/tle?page=4&page-size=2',
                'last' => 'http://localhost/api/tle?page=5&page-size=2'
            ]
        ]
    ];

    public function testPaginationWorks(): void
    {
        foreach (self::TEST as $test) {
            $this->assertViewIsCorrect(
                $test['expected'],
                $this->getCollectionPagination($test['page'], 2)
            );
        }
    }

    private function assertViewIsCorrect($expected, $actual): void
    {
        foreach ($actual as $key => $value) {
            self::assertArrayHasKey($key, $expected, \sprintf('Assert view has key %s', $key));
            self::assertEquals($value, $expected[$key], \sprintf('Assert value of key %s is correct', $key));
        }
    }

    private function getCollectionPagination(int $page, int $pageSize): array
    {
        $response = $this->get(
            '/api/tle',
            [
                'page' => $page,
                'page-size' => $pageSize,
            ]
        );

        $response = $this->toArray($response);

        return $response['view'];
    }
}