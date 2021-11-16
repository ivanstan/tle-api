<?php

namespace App\Request;

use App\Enum\SortDirectionEnum;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class CollectionRequest extends AbstractRequest
{
    public static string $pageParam = 'page';
    public static string $pageSizeParam = 'page-size';
    public static int $defaultPageSize = 20;
    public static int $maxPageSize = 100;

    public static string $sortDirParam = 'sort-dir';
    public static string $sortParam = 'sort';
    public static array $sortFields = [];

    public static string $searchParam = 'search';

    public function getPage(): int
    {
        return (int)$this->get(static::$pageParam, 1);
    }

    public function getPageSize(): int
    {
        return (int)min($this->get(static::$pageSizeParam, static::$defaultPageSize), static::$maxPageSize);
    }

    public function getSortDirection(): string
    {
        return $this->get(static::$sortDirParam, SortDirectionEnum::ASCENDING);
    }

    public function getSort(string $default = null): ?string
    {
        return $this->get(static::$sortParam, $default);
    }

    public function getSearch(): ?string
    {
        return $this->get(static::$searchParam);
    }

    public function validate(ValidatorInterface $validator): ConstraintViolationListInterface
    {
        return $validator->validate(
            $this->query->all(),
            new Assert\Collection(
                [
                    'allowExtraFields' => true,
                    'allowMissingFields' => true,
                    'fields' => [
                        static::$pageParam => new Assert\Optional(
                            new Assert\Sequentially(
                                [
                                    new Assert\Type('numeric'),
                                    new Assert\GreaterThanOrEqual(0),
                                ]
                            )
                        ),
                        static::$pageSizeParam => new Assert\Optional(
                            new Assert\Sequentially(
                                [
                                    new Assert\GreaterThanOrEqual(1),
                                    new Assert\LessThanOrEqual(static::$maxPageSize),
                                ]
                            )
                        ),
                        static::$searchParam => new Assert\Optional(new Assert\Type('string')),
                        static::$sortParam => new Assert\Optional(new Assert\Choice(static::$sortFields)),
                        static::$sortDirParam => new Assert\Optional(
                            new Assert\Choice([SortDirectionEnum::ASCENDING, SortDirectionEnum::DESCENDING])
                        ),
                    ],
                ]
            )
        );
    }
}
