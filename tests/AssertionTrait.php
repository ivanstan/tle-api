<?php

namespace App\Tests;

use App\Entity\Tle;

trait AssertionTrait
{
    public function assertTle(Tle $tle, array $response): void
    {
        $model = new \Ivanstan\Tle\Model\Tle($tle->getLine1(), $tle->getLine2(), $tle->getName());

        self::assertEquals('http://localhost/api/tle/'.$tle->getId(), $response['@id']);
        self::assertEquals('Tle', $response['@type']);
        self::assertEquals($tle->getId(), $response['satelliteId']);
        self::assertEquals($tle->getName(), $response['name']);
        self::assertEquals($model->epochDateTime()->format(\DateTimeInterface::ATOM), $response['date']);
        self::assertEquals($tle->getLine1(), $response['line1']);
        self::assertEquals($tle->getLine2(), $response['line2']);
    }

    public function assertObserverCorrect(array $expected, array $actual): void
    {
        self::assertEquals(
            [
                '@type' => 'Observer',
                'altitude' => 0,
                ...$expected,
            ],
            $actual
        );
    }
}
