<?php

namespace App\Service;

use Sentry\Event;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SentryCallbackBeforeSend
{
    protected const SKIP = [
        NotFoundHttpException::class,
    ];

    public function __invoke(Event $event): ?Event
    {
        $exceptions = $event->getExceptions();

        foreach ($exceptions as $exception) {
            if (in_array($exception->getType(), self::SKIP)) {
                return null;
            }
        }

        return $event;
    }
}
