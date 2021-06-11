<?php

namespace App\Tests;

use Symfony\Component\HttpFoundation\Response;

class ErrorPageTest extends AbstractWebTestCase
{
    public function test404(): void
    {
        $response = $this->get('/noop');

        self::assertEquals(
            Response::HTTP_NOT_FOUND,
            $response->getStatusCode(),
            'Assert page not found returns HTTP 404'
        );

        $response = $this->toArray($response);

        self::assertEquals(
            'No route found for "GET http://localhost/noop"',
            $response['response']['message'],
            'Assert correct response message'
        );
    }
}
