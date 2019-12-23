<?php

namespace App\Tests;

use App\DataFixtures\TleFixtures;
use App\ViewModel\Model\TleModel;
use PHPUnit\Framework\TestCase;

final class TleModelTest extends TestCase
{
    public function testParse(): void
    {
        $entity = TleFixtures::create();
        $tle = new TleModel($entity->getLine1(), $entity->getLine2(), $entity->getName());

        static::assertEquals(
            TleFixtures::$date,
            $tle->getDate(),
            'Failed asserting TLE returned correct date'
        );

        static::assertEquals(
            0,
            $tle->getChecksum(TleModel::LINE1),
            'Failed asserting TLE checksum for line1 is correct'
        );

        static::assertEquals(
            4,
            $tle->getChecksum(TleModel::LINE2),
            'Failed asserting TLE checksum for line2 is correct'
        );

        static::assertEquals(
            0,
            $tle->calculateChecksum(TleModel::LINE1),
            'Failed asserting TLE calculated checksum for line1 is correct'
        );

        static::assertEquals(
            4,
            $tle->calculateChecksum(TleModel::LINE2),
            'Failed asserting TLE calculated checksum for line2 is correct'
        );

        static::assertEquals(
            true,
            $tle->verify(),
            'Failed asserting that TLE is correct'
        );

        static::assertEquals(
            43550,
            $tle->getId(),
            'Failed asserting that TLE Satellite/Catalog number is correct'
        );

        static::assertEquals(
            'U',
            $tle->getClassification(),
            'Failed asserting that TLE classification is correct'
        );
    }
}
