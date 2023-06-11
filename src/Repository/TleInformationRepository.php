<?php

namespace App\Repository;

use App\Entity\Tle;
use App\Entity\TleInformation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TleInformationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TleInformation::class);
    }

    public function getMaxInclination(): ?Tle
    {
        $tle = $this->createQueryBuilder('i')
            ->select('i')
            ->orderBy('i.inclination', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getSingleResult();

        return $tle ? $tle->getTle() : null;
    }

    public function getMaxPeriod(): ?Tle
    {
        $tle = $this->createQueryBuilder('i')
            ->select('i')
            ->orderBy('i.period', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getSingleResult();

        return $tle ? $tle->getTle() : null;
    }

    public function getMinPeriod(): ?Tle
    {
        $tle = $this->createQueryBuilder('i')
            ->select('i')
            ->orderBy('i.period', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getSingleResult();

        return $tle ? $tle->getTle() : null;
    }

    public function getMaxEccentricity(): ?Tle
    {
        $tle = $this->createQueryBuilder('i')
            ->select('i')
            ->orderBy('i.eccentricity', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getSingleResult();

        return $tle ? $tle->getTle() : null;
    }
}
