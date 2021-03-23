<?php

namespace App\Repository;

use App\Entity\Statistic;
use App\Entity\Tle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class StatisticRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Statistic::class);
    }

    public function find($id, $lockMode = null, $lockVersion = null): ?Statistic
    {
        /** @var Statistic $statistic */
        $statistic = parent::find($id, $lockMode, $lockVersion);

        if ($statistic !== null) {
            return $statistic;
        }

        /** @var Tle $tle */
        $tle = $this->getEntityManager()->getRepository(Tle::class)->find($id);

        if ($tle === null) {
            return null;
        }

        $statistic = new Statistic($tle);
        $statistic->setHits(1);

        $this->_em->persist($statistic);

        return $statistic;
    }
}
