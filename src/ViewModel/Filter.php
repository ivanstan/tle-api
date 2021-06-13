<?php

namespace App\ViewModel;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class Filter
{
    public const FILTER_TYPE_FLOAT = 'float';
    public const FILTER_TYPE_ARRAY = 'array';

    public const OPERATOR_EQUAL = '=';
    public const OPERATOR_GREATER_THEN = '>';
    public const OPERATOR_GREATER_THEN_EQUAL = '>=';
    public const OPERATOR_LESS_THEN = '<';
    public const OPERATOR_LESS_THEN_EQUAL = '<=';
    public const REST_OPERATOR_GREATER_THEN = 'gt';
    public const REST_OPERATOR_GREATER_THEN_EQUAL = 'gte';
    public const REST_OPERATOR_LESS_THEN = 'lt';
    public const REST_OPERATOR_LESS_THEN_EQUAL = 'lte';

    public const BOOLEAN_VALUES = [
        '1',
        '0',
    ];

    public const FILTER_FLOAT_OPERATORS = [
        self::FILTER_TYPE_FLOAT => [
            self::REST_OPERATOR_GREATER_THEN => self::OPERATOR_GREATER_THEN,
            self::REST_OPERATOR_GREATER_THEN_EQUAL => self::OPERATOR_GREATER_THEN_EQUAL,
            self::REST_OPERATOR_LESS_THEN => self::OPERATOR_LESS_THEN,
            self::REST_OPERATOR_LESS_THEN_EQUAL => self::OPERATOR_LESS_THEN_EQUAL,
        ],
    ];

    public mixed $value;
    public string $sqlOperator;

    public function __construct(public string $filter, public string $type, public string $operator, mixed $value)
    {
        $this->value = $this->validateValue($value);
        $this->sqlOperator = $this->validateOperator();
    }

    protected function validateOperator(): string
    {
        if ($this->type === self::FILTER_TYPE_FLOAT) {
            $operators = self::FILTER_FLOAT_OPERATORS[self::FILTER_TYPE_FLOAT];
            if (!array_key_exists($this->operator, $operators)) {
                throw new BadRequestHttpException(
                    \sprintf(
                        'Operator for filter \'%s\' should be one of the following %s, \'%s\' provided',
                        $this->filter,
                        implode(', ', array_keys($operators)),
                        $this->operator
                    )
                );
            }

            return $operators[$this->operator];
        }

        if ($this->type === self::FILTER_TYPE_ARRAY) {
            return self::OPERATOR_EQUAL;
        }

        return '';
    }

    protected function validateValue(mixed $value): mixed
    {
        if ($this->type === self::FILTER_TYPE_FLOAT) {
            $value = (float)$value;

            if (!is_float($value)) {
                throw new \InvalidArgumentException(
                    \sprintf('Filter %s value should be %s', $this->filter, $this->type)
                );
            }

            return $value;
        }

        if ($this->type === self::FILTER_TYPE_ARRAY) {
            if (!is_array($value)) {
                throw new \InvalidArgumentException(
                    \sprintf('Filter %s value should be %s', $this->filter, $this->type)
                );
            }

            return $value;
        }

        return null;
    }
}
