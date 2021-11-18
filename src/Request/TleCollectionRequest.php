<?php

namespace App\Request;

use Ivanstan\SymfonySupport\Request\CollectionRequest;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TleCollectionRequest extends CollectionRequest
{
    use TleRequestTrait {
        validate as validateExtraParam;
    }

    public static array $sortFields = [
        'id',
        'name',
        'popularity',
        'inclination',
        'eccentricity',
        'period',
        'raan',
        'satellite_id',
        'semi_major_axis',
    ];

    public function validate(ValidatorInterface $validator): ConstraintViolationListInterface
    {
        $violations = $this->validateExtraParam($validator);
        $violations->addAll(parent::validate($validator));

        return $violations;
    }
}
