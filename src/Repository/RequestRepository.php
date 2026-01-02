<?php

namespace App\Repository;

use App\Entity\Request;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class RequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Request::class);
    }

    public function removeBefore(\DateTime $dateTime): int
    {
        $builder = $this->_em->createQueryBuilder();

        $builder
            ->delete(Request::class, 'r')
            ->where('r.createdAt < :date')
            ->setParameter('date', $dateTime);

        return $builder->getQuery()->execute();
    }
}
