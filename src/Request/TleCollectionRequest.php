<?php

namespace App\Request;

use App\Enum\TleCollectionSortableFieldsEnum;
use App\ViewModel\Filter;
use Ivanstan\SymfonySupport\Request\CollectionRequest;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TleCollectionRequest extends CollectionRequest
{
    use TleRequestTrait {
        validate as validateExtraParam;
    }

    protected const COLLECTION_FILTERS = [
        TleCollectionSortableFieldsEnum::ECCENTRICITY => Filter::FILTER_TYPE_FLOAT,
        TleCollectionSortableFieldsEnum::INCLINATION => Filter::FILTER_TYPE_FLOAT,
        TleCollectionSortableFieldsEnum::PERIOD => Filter::FILTER_TYPE_FLOAT,
        TleCollectionSortableFieldsEnum::SATELLITE_ID => Filter::FILTER_TYPE_ARRAY,
    ];

    public static array $sortFields = [
        'id',
        'name',
        'popularity',
        'inclination',
        'eccentricity',
        'period',
        'raan',
        'satellite_id',
        'semi_major_axis',
    ];

    protected ?array $filters = null;

    public function validate(ValidatorInterface $validator): ConstraintViolationListInterface
    {
        $violations = $this->validateExtraParam($validator);
        $violations->addAll(parent::validate($validator));

        return $violations;
    }

    public function getSatelliteIdsFilter(): array
    {
        return $this->get(TleCollectionSortableFieldsEnum::SATELLITE_ID, []);
    }

    /**
     * @return Filter[]
     */
    public function getFilters(array $filters = self::COLLECTION_FILTERS): array
    {
        if ($this->filters !== null) {
            return $this->filters;
        }

        $result = [];

        foreach ($filters as $filter => $type) {
            $values = $this->get($filter, []);

            if ($type === Filter::FILTER_TYPE_ARRAY && !empty($values)) {
                $result[] = new Filter($filter, $type, Filter::OPERATOR_EQUAL, $values);

                continue;
            }

            foreach ($values as $operator => $value) {
                $result[] = new Filter($filter, $type, $operator, $value);
            }
        }

        $this->filters = $result;

        return $this->filters;
    }

    public function getParameters(): array
    {
        $parameters = [
            self::$searchParam => $this->getSearch() ?? '*',
            self::$sortParam => $this->getSort(TleCollectionSortableFieldsEnum::POPULARITY),
            self::$sortDirParam => $this->getSortDirection(),
            self::$pageParam => $this->getPage(),
            self::$pageSizeParam => $this->getPageSize(),
        ];

        foreach ($this->getFilters() as $filter) {
            if ($filter->filter === TleCollectionSortableFieldsEnum::SATELLITE_ID) {
                continue;
            }
            $parameters[\sprintf('%s[%s]', $filter->filter, $filter->operator)] = $filter->value;
        }

        foreach ($this->getSatelliteIdsFilter() as $index => $satelliteId) {
            $name = \sprintf('%s[%d]', TleCollectionSortableFieldsEnum::SATELLITE_ID, $index);
            $parameters[$name] = $satelliteId;
        }

        return $parameters;
    }
}
