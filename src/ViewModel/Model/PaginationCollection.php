<?php

namespace App\ViewModel\Model;

use Doctrine\ORM\NonUniqueResultException;
use Doctrine\ORM\QueryBuilder;

class PaginationCollection
{
    public function __construct(protected QueryBuilder $builder)
    {
    }

    public function getCollection(
        int $pageSize,
        int $offset
    ): array {
        $builder = clone $this->builder;

        $builder->setMaxResults($pageSize);
        $builder->setFirstResult($offset);

        return $builder->getQuery()->getResult();
    }

    public function getTotal(): int
    {
        $builder = clone $this->builder;

        $alias = $builder->getRootAliases()[0] ?? null;
        $entity = $builder->getRootEntities()[0] ?? null;

        $meta = $builder->getEntityManager()->getClassMetadata($entity);
        $identifier = $meta->identifier[0] ?? null;

        $builder->select("COUNT($alias.$identifier)");

        try {
            return $builder->getQuery()->getSingleScalarResult();
        } catch (NonUniqueResultException) {
            $result = array_map(static fn($item) => (int)$item, $builder->getQuery()->getScalarResult());

            return array_sum($result);
        }
    }
}
