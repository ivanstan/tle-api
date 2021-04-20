<?php

namespace App\Service\Traits;

use App\Entity\Tle;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

trait TleHttpTrait
{
    protected function getTle(int $id): Tle
    {
        /** @var Tle $tle */
        $tle = $this->repository->findOneBy(['id' => $id]);

        if ($tle === null) {
            throw new NotFoundHttpException(\sprintf('Unable to find record with id %s', $id));
        }

        return $tle;
    }
}
