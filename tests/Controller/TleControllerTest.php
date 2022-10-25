<?php

namespace App\Tests\Controller;

use App\DataFixtures\TleFixtures;
use App\Tests\AbstractWebTestCase;
use App\Tests\AssertionTrait;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

class TleControllerTest extends AbstractWebTestCase
{
    use AssertionTrait;

    protected function setUp(): void
    {
        parent::setUp();

        $input = new ArrayInput(
            [
                'command' => 'tle:calculate',
                '--tle' => TleFixtures::createDeep()->getId(),
            ]
        );

        $application = new Application(static::$kernel);
        $application->setAutoExit(false);
        $application->run($input, new BufferedOutput());
    }

    public function testTleExtraFieldsMissingData(): void
    {
        $tle = TleFixtures::createDeep();

        $response = $this->get('/api/tle/'.$tle->getId(), ['extra' => 1]);

        $response = $this->toArray($response);

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);

        $this->assertTle($tle, $response);
    }

    public function testTleExtraFields(): void
    {
        $tle = TleFixtures::create();

        $response = $this->get('/api/tle/'.$tle->getId(), ['extra' => 1]);

        $response = $this->toArray($response);

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);

        $this->assertTle($tle, $response);
    }
}
