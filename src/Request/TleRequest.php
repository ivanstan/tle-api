<?php

namespace App\Request;

use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TleRequest extends AbstractRequest
{
    public const EXTRA_PARAM = 'extra';

    use TleRequestTrait {
        validate as validateExtraParam;
    }

    public function getId(): int
    {
        return $this->attributes->get('id');
    }

    public function validate(ValidatorInterface $validator): ConstraintViolationListInterface
    {
        return $this->validateExtraParam($validator);
    }
}