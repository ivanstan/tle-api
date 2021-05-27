<?php

namespace App\Service\Traits;

use App\Entity\Tle;
use App\ViewModel\Observer;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
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

    protected function getObserver(Request $request): Observer
    {
        try {
            return new Observer((float)$request->get('latitude', 0), (float)$request->get('longitude', 0));
        } catch (\InvalidArgumentException $exception) {
            throw new BadRequestHttpException($exception->getMessage());
        }
    }
}
