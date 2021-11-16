<?php

namespace App\Request;

use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

interface ValidatedRequestInterface
{
    public function validate(ValidatorInterface $validator): ?ConstraintViolationListInterface;
}
