<?php

namespace App\Repository;

use App\Entity\Request;
use App\Entity\Tle;
use App\Entity\TleInformation;
use App\ViewModel\Filter;
use App\ViewModel\Model\PaginationCollection;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\NonUniqueResultException;
use Doctrine\ORM\Query\Expr;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class TleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tle::class);
    }

    /**
     * @return Tle[]|Collection
     */
    public function fetchAllIndexed(): array|Collection
    {
        return $this->createQueryBuilder('tle', 'tle.id')
            ->getQuery()
            ->getResult();
    }

    public function collection(
        ?string $search,
        string $sort,
        string $sortDir,
        int $pageSize,
        int $offset,
        array $filters,
    ): PaginationCollection {
        $builder = $this->createQueryBuilder('tle');

        $builder->select('tle');
        $builder->leftJoin(TleInformation::class, 'info', Expr\Join::WITH, 'info.tle = tle.id');

        // search
        if ($search) {
            $builder
                ->where(
                    $builder->expr()->orX(
                        $builder->expr()->like('tle.id', ':search'),
                        $builder->expr()->like('tle.name', ':search')
                    )
                )
                ->setParameter('search', '%' . $search . '%');
        }

        // filters
        foreach ($filters as $index => $filter) {
            if ($filter->type === Filter::FILTER_TYPE_ARRAY) {
                $paramName = \sprintf('param_%d', $index);

                $builder
                    ->andWhere(\sprintf("%s IN (:%s)", $this->getSortTableColumnMapping($filter->filter), $paramName))
                    ->setParameter($paramName, $filter->value);

                continue;
            }

            $placeholder = \sprintf('filter_%s_%d', $filter->filter, $index);
            $builder->andWhere(\sprintf('info.%s %s :%s', $filter->filter, $filter->sqlOperator, $placeholder));
            $builder->setParameter($placeholder, $filter->value);
        }

        // sort
        if ($sort === TleCollectionSortableFieldsEnum::POPULARITY) {
            $before = (new \DateTime())->sub(new \DateInterval('P7D'));
            $builder->leftJoin(Request::class, 's', Expr\Join::WITH, 's.tle = tle.id AND s.createdAt < :date');
            $builder->setParameter('date', $before);
            $builder->groupBy('tle.id');
            $builder->addOrderBy('COUNT(s.id)', $sortDir);
        } else {
            $builder->addOrderBy($this->getSortTableColumnMapping($sort), $sortDir);
        }

        $total = $this->getCount($builder);

        // limit
        $builder->setMaxResults($pageSize);
        $builder->setFirstResult($offset);

        $collection = new PaginationCollection();

        $collection->setCollection($builder->getQuery()->getResult());
        $collection->setTotal($total);

        return $collection;
    }

    /**
     * @throws \Doctrine\ORM\NoResultException
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    private function getCount(QueryBuilder $builder): int
    {
        $builder = clone $builder;

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

    private function getSortTableColumnMapping(string $sort): ?string
    {
        return match ($sort) {
            TleCollectionSortableFieldsEnum::ID => 'tle.id',
            TleCollectionSortableFieldsEnum::SATELLITE_ID => 'tle.id',
            TleCollectionSortableFieldsEnum::NAME => 'tle.name',
            TleCollectionSortableFieldsEnum::POPULARITY => null,
            TleCollectionSortableFieldsEnum::INCLINATION => 'info.inclination',
            TleCollectionSortableFieldsEnum::ECCENTRICITY => 'info.eccentricity',
            TleCollectionSortableFieldsEnum::PERIOD => 'info.period',
            TleCollectionSortableFieldsEnum::SEMI_MAJOR_AXIS => 'info.semiMajorAxis',
            TleCollectionSortableFieldsEnum::RAAN => 'info.raan',
        };
    }
}
