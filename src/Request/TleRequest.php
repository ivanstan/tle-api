<?php

namespace App\Request;

use App\Entity\Tle;
use App\Repository\TleRepository;
use Ivanstan\SymfonySupport\Request\AbstractRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
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

    public function getTle(): Tle
    {
        /** @var Tle $tle */
        $tle = $this->repository->findOneBy(['id' => $this->getId()]);

        if ($tle === null) {
            throw new NotFoundHttpException(\sprintf('Unable to find record with id %s', $this->getId()));
        }

        return $tle;
    }
}
