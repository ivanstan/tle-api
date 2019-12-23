<?php

namespace App\Tests;

class ErrorPageTest extends AbstractWebTestCase
{
    public function test404(): void
    {
        $response = $this->get('/noop');

        self::assertEquals($response->getStatusCode(), 404, 'Assert page not found returns HTTP 404');

        $response = $this->toArray($response);

        self::assertEquals(404, $response['response']['code'], 'Assert correct response code in json');
        self::assertEquals(
            'No route found for "GET /noop"',
            $response['response']['message'],
            'Assert correct response message'
        );
    }
}