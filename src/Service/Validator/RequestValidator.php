<?php

namespace App\Service\Validator;

use App\ViewModel\Filter;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

trait RequestValidator
{
    protected function assertParamIsBoolean(Request $request, string $name): self {
        $param = $request->get($name);

        if ($param === null) {
            return $this;
        }

        if (!in_array($param, Filter::BOOLEAN_VALUES, true)) {
            throw new BadRequestHttpException(
                \sprintf('Parameter \'%s\' must be boolean. Supported values are %s.', $name, implode(' or ', Filter::BOOLEAN_VALUES))
            );
        }

        return $this;
    }

    protected function assertParamIsInteger(Request $request, string $name): self
    {
        $param = (int)$request->get($name);

        if ($param === null) {
            return $this;
        }

        if (!preg_match('/^\d+$/', $param)) {
            throw new BadRequestHttpException(
                \sprintf('Parameter \'%s\' must be integer.', $name)
            );
        }

        return $this;
    }

    protected function assertParamIsGreaterThan(Request $request, string $name, float $value): self
    {
        $param = $request->get($name);

        if ($param === null) {
            return $this;
        }

        if (!($param > $value)) {
            throw new BadRequestHttpException(
                \sprintf('Parameter \'%s\' must be greater than %d.', $name, $value)
            );
        }

        return $this;
    }

    protected function assertParamIsLessThan(Request $request, string $name, float $value): self
    {
        $param = $request->get($name);

        if ($param === null) {
            return $this;
        }

        if (!($param <= $value)) {
            throw new BadRequestHttpException(
                \sprintf('Parameter \'%s\' must be less than %d.', $name, $value)
            );
        }

        return $this;
    }

    protected function assertParamInEnum(Request $request, string $name, array $values): self
    {
        $param = $request->get($name);

        if ($param === null) {
            return $this;
        }

        if (!\in_array($param, $values, true)) {
            throw new BadRequestHttpException(
                \sprintf(
                    'Parameter \'%s\' must be one of the following: %s',
                    $name,
                    '\'' . implode('\', \'', $values) . '\'',
                )
            );
        }

        return $this;
    }

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
