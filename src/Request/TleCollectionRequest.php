<?php

namespace App\Request;

use App\Enum\TleCollectionSortableFieldsEnum;
use App\Enum\TleFilterFieldsEnum;
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
        // Orbit type filters
        TleFilterFieldsEnum::GEOSTATIONARY_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::GEOSYNCHRONOUS_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::CIRCULAR_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::ELLIPTICAL_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::LOW_EARTH_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::MEDIUM_EARTH_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::HIGH_EARTH_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::POLAR_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::SUN_SYNCHRONOUS_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::MOLNIYA_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::TUNDRA_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::CRITICAL_INCLINATION_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::POSIGRADE_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::RETROGRADE_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::DECAYING_ORBIT => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::LOW_DRAG => Filter::FILTER_TYPE_BOOLEAN,
        // Classification filters
        TleFilterFieldsEnum::CLASSIFIED_SATELLITE => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::UNCLASSIFIED_SATELLITE => Filter::FILTER_TYPE_BOOLEAN,
        TleFilterFieldsEnum::RECENT_TLE => Filter::FILTER_TYPE_BOOLEAN,
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
        if (null !== $this->filters) {
            return $this->filters;
        }

        $result = [];

        foreach ($filters as $filter => $type) {
            $values = $this->get($filter, []);

            if (Filter::FILTER_TYPE_ARRAY === $type && !empty($values)) {
                $result[] = new Filter($filter, $type, Filter::OPERATOR_EQUAL, $values);

                continue;
            }

            if (Filter::FILTER_TYPE_BOOLEAN === $type) {
                // Boolean filters are passed as simple values (e.g., lowEarthOrbit=1)
                // not as arrays with operators
                $value = $this->get($filter, null);
                if (null !== $value && '' !== $value) {
                    $result[] = new Filter($filter, $type, Filter::OPERATOR_EQUAL, $value);
                }

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
            if (TleCollectionSortableFieldsEnum::SATELLITE_ID === $filter->filter) {
                continue;
            }
            
            // Boolean filters don't need operator in the parameter name
            if (Filter::FILTER_TYPE_BOOLEAN === $filter->type) {
                $parameters[$filter->filter] = $filter->value ? 1 : 0;
            } else {
                $parameters[\sprintf('%s[%s]', $filter->filter, $filter->operator)] = $filter->value;
            }
        }

        foreach ($this->getSatelliteIdsFilter() as $index => $satelliteId) {
            $name = \sprintf('%s[%d]', TleCollectionSortableFieldsEnum::SATELLITE_ID, $index);
            $parameters[$name] = $satelliteId;
        }

        return $parameters;
    }
}
