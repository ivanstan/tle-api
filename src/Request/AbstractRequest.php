<?php

namespace App\Request;

use App\ViewModel\Filter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AbstractRequest extends Request implements ValidatedRequestInterface
{
    public function __construct(
        array $query = [],
        array $request = [],
        array $attributes = [],
        array $cookies = [],
        array $files = [],
        array $server = [],
        $content = null
    ) {
        parent::__construct($query, $request, $attributes, $cookies, $files, $server, $content);

        $this->validate();
    }

    public function validate(): void
    {
    }

    protected function assertParamIsBoolean(Request $request, string $name): self
    {
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
}
