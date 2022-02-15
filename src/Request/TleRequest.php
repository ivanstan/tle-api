<?php

namespace App\Request;

use App\Repository\TleRepository;
use Ivanstan\SymfonySupport\Request\AbstractRequest;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\Service\Attribute\Required;

class TleRequest extends AbstractRequest
{
    public const EXTRA_PARAM = 'extra';

    protected TleRepository $repository;

    use TleRequestTrait {
        validate as validateExtraParam;
    }

    #[Required]
    public function setRepository(TleRepository $repository): void
    {
        $this->repository = $repository;
    }

    public function getId(): int
    {
        return $this->attributes->get('id');
    }

    public function validate(ValidatorInterface $validator): ConstraintViolationListInterface
    {
        $violations = $this->validateExtraParam($validator);
        $violations->addAll(parent::validate($validator));

        return $violations;
    }
}
