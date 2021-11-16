<?php

namespace App\Service\Validator;

use App\ViewModel\Filter;
use Symfony\Component\HttpFoundation\Request;

trait RequestValidator
{
    protected function assertFilter(Request $request, array $filters): array
    {
        $result = [];

        foreach ($filters as $filter => $type) {
            $values = $request->get($filter, []);

            if ($type === Filter::FILTER_TYPE_ARRAY && !empty($values)) {
                $result[] = new Filter($filter, $type, Filter::OPERATOR_EQUAL, $values);

                continue;
            }

            foreach ($values as $operator => $value) {
                $result[] = new Filter($filter, $type, $operator, $value);
            }
        }

        return $result;
    }
}
