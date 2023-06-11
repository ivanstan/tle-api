<?php

namespace App\Repository;

use App\Entity\Tle;
use App\Entity\TleStat;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TleStatRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TleStat::class);
    }

    public function update(string $name, Tle $tle): void
    {
        $stat = $this->createQueryBuilder('s')
            ->select('s')
            ->where('s.name = :name')
            ->setParameter('name', $name)
            ->getQuery()
            ->getOneOrNullResult();

        if ($stat === null) {
            $stat = new TleStat($name);
        }

        $stat->setName($name);
        $stat->setTle($tle);

        $this->getEntityManager()->persist($stat);
        $this->getEntityManager()->flush();
    }

    public function get(): \Generator
    {
        $stats = $this->findAll();

        foreach ($stats as $stat) {
            yield $stat->getName() => $stat->getTle();
        }
    }
}
