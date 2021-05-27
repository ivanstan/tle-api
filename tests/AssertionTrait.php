<?php

namespace App\Tests;

use App\Entity\Tle;

trait AssertionTrait
{
    public function assertTle(Tle $tle, array $response, bool $extra = false): void
    {
        $model = new \Ivanstan\Tle\Model\Tle($tle->getLine1(), $tle->getLine2(), $tle->getName());

        self::assertEquals('https://www.w3.org/ns/hydra/context.jsonld', $response['@context']);
        self::assertEquals('http://localhost/api/tle/' . $tle->getId(), $response['@id']);
        self::assertEquals('TleModel', $response['@type']);
        self::assertEquals($tle->getId(), $response['satelliteId']);
        self::assertEquals($tle->getName(), $response['name']);
        self::assertEquals($model->getDate(), $response['date']);
        self::assertEquals($tle->getLine1(), $response['line1']);
        self::assertEquals($tle->getLine2(), $response['line2']);
    }
}
