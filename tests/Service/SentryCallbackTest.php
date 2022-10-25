<?php

namespace App\Tests\Service;

use App\Service\SentryCallbackBeforeSend;
use PHPUnit\Framework\TestCase;
use Sentry\Event;
use Sentry\ExceptionDataBag;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SentryCallbackTest extends TestCase
{
    public function testFilterOutHttpNotFoundException(): void
    {
        $callback = new SentryCallbackBeforeSend();

        $event = Event::createTransaction();

        $event->setExceptions(
            [
                new ExceptionDataBag(new NotFoundHttpException()),
            ]
        );

        self::assertNull($callback($event));
    }

    public function testOtherExceptionsForwarded(): void
    {
        $callback = new SentryCallbackBeforeSend();

        $event = Event::createTransaction();

        $event->setExceptions(
            [
                new ExceptionDataBag(new \Exception()),
            ]
        );

        /* @noinspection GetClassUsageInspection */
        self::assertEquals(Event::class, get_class($callback($event)));
    }
}
