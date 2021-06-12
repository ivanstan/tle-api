<?php

namespace App\Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\BrowserKit\AbstractBrowser;
use Symfony\Component\HttpFoundation\Response;

class AbstractWebTestCase extends WebTestCase
{
    protected static AbstractBrowser $client;

    protected function setUp(): void
    {
        self::$client = static::createClient();
        parent::setUp();
    }

    protected function get(string $url, array $params = []): Response
    {
        self::$client->request('GET', $this->buildUrl($url, $params));

        return self::$client->getResponse();
    }

    /**
     * @throws \JsonException
     */
    protected function toArray(Response $response): array
    {
        return json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function buildUrl(string $url, array $params = []): string
    {
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        return $url;
    }
}
