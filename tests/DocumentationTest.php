<?php

namespace App\Tests;

use App\DataFixtures\TleFixtures;
use Symfony\Component\HttpFoundation\Response;

final class DocumentationTest extends AbstractWebTestCase
{
    public function testDocumentationIsCorrect(): void
    {
        $response = $this->get('/api/tle.json');

        self::assertEquals(Response::HTTP_OK, $response->getStatusCode(), 'Assert json documentation is available');

        $response = $this->toArray($response);

        $collectionSchema = $response['paths']['/api/tle']['get']['responses'][200]['content']['application/json']['schema']['properties'];
        $paginationSchema = $response['components']['schemas']['Pagination']['properties'];
        $tleSchema = $response['components']['schemas']['TleModel']['allOf'][0]['properties'];

        $tle = TleFixtures::create();

        $response = $this->toArray($this->get('/api/tle/' . $tle->getId()));

        self::assertCount(\count($tleSchema), $response);
        self::assertEquals(array_keys($tleSchema), array_keys($response));

        $response = $this->toArray($this->get('/api/tle/', ['page-size' => 2, 'page' => 2]));

        self::assertCount(\count($paginationSchema), $response['view']);
        self::assertEquals(array_keys($paginationSchema), array_keys($response['view']));

        self::assertCount(\count($response), $collectionSchema);
        self::assertEquals(array_keys($response), array_keys($collectionSchema));
    }
}
