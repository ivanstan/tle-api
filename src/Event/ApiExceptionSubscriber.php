<?php

namespace App\Event;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

class ApiExceptionSubscriber implements EventSubscriberInterface
{
    /**
     * Exception handler will fire on exception occurred on a path bellow /.
     */
    protected const API_PATH = '/';

    private string $env;

    public function __construct($env)
    {
        $this->env = $env;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onException',
        ];
    }

    public function onException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        $path = $event->getRequest()->getPathInfo();

        if (strpos($path, self::API_PATH) === false) {
            return;
        }

        if ($exception instanceof NotFoundHttpException) {
            $this->setResponse($event, $exception->getMessage());
        }

        if ($exception instanceof AccessDeniedHttpException) {
            $this->setResponse($event, 'Forbidden');
        }

        if ($this->env === 'dev') {
            $this->setResponse($event, $exception->getMessage());
        }
    }

    private function setResponse(ExceptionEvent $event, string $message): void
    {
        $response = new JsonResponse(
            [
                'response' => [
                    'message' => $message,
                ],
            ]
        );

        $event->setResponse($response);
    }
}
