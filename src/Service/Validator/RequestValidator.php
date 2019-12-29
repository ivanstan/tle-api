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
}