<?php

namespace App\Repository;

use App\Entity\Request;
use App\Entity\Tle;
use App\Entity\TleInformation;
use App\Enum\TleCollectionSortableFieldsEnum;
use App\ViewModel\Filter;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Query\Expr;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Ivanstan\SymfonySupport\Repository\EntityRepository;

class TleRepository extends EntityRepository
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
        array $filters,
    ): QueryBuilder {
        $builder = $this->createQueryBuilder('tle');

        $builder->select('tle');
        $builder->leftJoin(TleInformation::class, 'info', Expr\Join::WITH, 'info.tle = tle.id');

        $builder = $this->search($builder, ['tle.id', 'tle.name'], $search);

        // filters
        foreach ($filters as $index => $filter) {
            if (Filter::FILTER_TYPE_ARRAY === $filter->type) {
                $paramName = \sprintf('param_%d', $index);

                $builder
                    ->andWhere(\sprintf('%s IN (:%s)', $this->getSortTableColumnMapping($filter->filter), $paramName))
                    ->setParameter($paramName, $filter->value);

                continue;
            }

            $placeholder = \sprintf('filter_%s_%d', $filter->filter, $index);
            $builder->andWhere(\sprintf('info.%s %s :%s', $filter->filter, $filter->sqlOperator, $placeholder));
            $builder->setParameter($placeholder, $filter->value);
        }

        // sort
        if (TleCollectionSortableFieldsEnum::POPULARITY === $sort) {
            $before = (new \DateTime())->sub(new \DateInterval('P7D'));
            $builder->leftJoin(Request::class, 's', Expr\Join::WITH, 's.tle = tle.id AND s.createdAt < :date');
            $builder->setParameter('date', $before);
            $builder->groupBy('tle.id');
            $builder->addOrderBy('COUNT(s.id)', $sortDir);
        } else {
            $builder->addOrderBy($this->getSortTableColumnMapping($sort), $sortDir);
        }

        return $builder;
    }

    private function getSortTableColumnMapping(string $sort): ?string
    {
        return match ($sort) {
            TleCollectionSortableFieldsEnum::ID, TleCollectionSortableFieldsEnum::SATELLITE_ID => 'tle.id',
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
