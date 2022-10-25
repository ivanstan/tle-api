<?php

namespace App\DataFixtures;

use App\Entity\Tle;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

final class TleFixtures extends Fixture
{
    private static int $satelliteId = 43550;
    private static string $name = '1998-067NY';
    private static string $line1 = '1 43550U 98067NY  18321.21573649  .00013513  00000-0  18402-3 0  9990';
    private static string $line2 = '2 43550  51.6389 334.0891 0005785  67.0956 293.0647 15.57860024 19804';
    public static string $date = '2018-11-17T05:10:39+00:00';

    public static function create(): Tle
    {
        $tle = new Tle();
        $tle->setId(self::$satelliteId);
        $tle->setName(self::$name);
        $tle->setLine1(self::$line1);
        $tle->setLine2(self::$line2);

        return $tle;
    }

    public static function createDeep(): Tle
    {
        $tle = new Tle();
        $tle->setId(22049);
        $tle->setName('GEOTAIL');
        $tle->setLine1('1 22049U 92044A   21119.24930644 -.00001485  00000-0  00000+0 0  9990');
        $tle->setLine2('2 22049  38.4941  42.7845 5317694 181.2241 357.6003  0.19228928 12156');

        return $tle;
    }

    public function load(ObjectManager $manager): void
    {
        // create single record
        $manager->persist(self::create());
        $manager->persist(self::createDeep());

        // create additional nine records with dummy satelliteIds
        for ($satelliteId = 1; $satelliteId < 10; ++$satelliteId) {
            $tle = self::create();
            $tle->setId($satelliteId);

            $manager->persist($tle);
        }

        $manager->flush();
    }
}
