<?php

namespace App\Request;

use App\Enum\SortDirectionEnum;

class CollectionRequest extends AbstractRequest
{
    /** @var int ToDo: use late static binding */
    public const PAGE_MAX_SIZE = 100;
    public const PAGE_PARAM = 'page';
    public const PAGE_SIZE = 20;
    public const PAGE_SIZE_PARAM = 'page-size';

    public const SORT_DIR_PARAM = 'sort-dir';
    public const SORT_PARAM = 'sort';

    public const SEARCH_PARAM = 'search';

    public function getPage(): int
    {
        return (int)$this->get(self::PAGE_PARAM, 1);
    }

    public function getPageSize(int $maxPageSize = self::PAGE_MAX_SIZE): int
    {
        return (int)min($this->get(self::PAGE_SIZE_PARAM, self::PAGE_SIZE), $maxPageSize);
    }

    public function getSortDirection(): string
    {
        return $this->get(self::SORT_DIR_PARAM, SortDirectionEnum::ASCENDING);
    }

    public function getSort(string $default = null): ?string
    {
        return $this->get(self::SORT_PARAM, $default);
    }

    public function getSearch(): ?string
    {
        return $this->get(self::SEARCH_PARAM);
    }
}
