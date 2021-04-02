<?php

namespace App\Repository;

use App\Entity\Request;
use App\Entity\Statistic;
use App\Entity\Tle;
use App\Entity\TleInformation;
use App\ViewModel\Model\PaginationCollection;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Collections\Collection;
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
    public function fetchAllIndexed()
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

        $total = $this->getCount($builder);

        if (!empty($filters)) {
            foreach ($filters as $filter => $operators) {
                $key = 0;
                foreach ($operators as $operator => $value) {
                    $paramName = 'filter_' . $filter . '_' . $key;
                    $builder->andWhere(\sprintf('info.%s %s :%s', $filter, $operator, $paramName));
                    $builder->setParameter($paramName, $value);
                    $key++;
                }
            }
        }

        // sort
        if ($sort === TleCollectionSortableFieldsEnum::POPULARITY) {
            $builder->leftJoin(Statistic::class, 's', Expr\Join::WITH, 's.tle = tle.id');
            $builder->addOrderBy('s.hits', $sortDir);
        } else {
            $builder->addOrderBy('tle.' . $sort, $sortDir);
        }

        // limit
        $builder->setMaxResults($pageSize);
        $builder->setFirstResult($offset);

        $collection = new PaginationCollection();

        $collection->setCollection($builder->getQuery()->getResult());
        $collection->setTotal($total);

        return $collection;
    }

    public function popular(\DateTime $newerThen, int $limit): array
    {
        $builder = $this->_em->createQueryBuilder();

        $builder->select(['t.name', 't.id', 'COUNT(q.ip) as hits'])
            ->from(Request::class, 'q')
            ->distinct('t.id')
            ->leftJoin('q.tle', 't')
            ->groupBy('t.id')
            ->where('q.createdAt > :newerThan')
            ->setParameter('newerThan', $newerThen)
            ->setMaxResults($limit)
            ->orderBy('hits', 'DESC');

        return $builder->getQuery()->getResult();
    }

    private function getCount(QueryBuilder $builder): int
    {
        $builder = clone $builder;

        $builder->select('count(tle.id)');

        return $builder->getQuery()->getSingleScalarResult();
    }
}
