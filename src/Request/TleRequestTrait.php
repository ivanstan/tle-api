<?php

namespace App\Request;

use App\ViewModel\Filter;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;

trait TleRequestTrait
{
    public function getExtra(): bool
    {
        return (bool)$this->get(TleRequest::EXTRA_PARAM, false);
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
                        TleRequest::EXTRA_PARAM => new Assert\Optional(new Assert\Choice(Filter::BOOLEAN_VALUES)),
                    ],
                ]
            )
        );
    }
}
