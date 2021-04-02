<?php

namespace App\Service\Validator;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

trait RequestValidator
{
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

            foreach ($values as $operator => $value) {
                $operator = $this->assertOperator($operator, $type, $filter);
                $value = $this->assertValue($value, $type, $filter);

                $result[$filter][$operator] = $value;
            }
        }

        return $result;
    }

    protected function assertOperator(string $operator, string $type, string $filter): ?string
    {
        if ($type === self::FILTER_TYPE_FLOAT) {
            $operators = self::FILTER_FLOAT_OPERATORS[self::FILTER_TYPE_FLOAT];
            if (!array_key_exists($operator, $operators)) {
                throw new BadRequestHttpException(
                    \sprintf(
                        'Operator for filter \'%s\' should be one of the following %s, \'%s\' provided',
                        $filter,
                        implode(', ', array_keys($operators)),
                        $operator
                    )
                );
            }

            return $operators[$operator];
        }

        return null;
    }

    /**
     * @noinspection CallableParameterUseCaseInTypeContextInspection
     */
    protected function assertValue(string $value, string $type, string $filter): mixed
    {
        if ($type === self::FILTER_TYPE_FLOAT) {
            $value = (float)$value;

            if (!is_float($value)) {
                throw new BadRequestHttpException(
                    \sprintf('Filter %s value should be %s', $filter, $type)
                );
            }

            return $value;
        }

        return null;
    }
}
