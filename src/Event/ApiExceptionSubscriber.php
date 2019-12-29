<?php

namespace App\Event;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpException;
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
        if (strpos($event->getRequest()->getPathInfo(), self::API_PATH) === false) {
            return;
        }

        $exception = $event->getThrowable();

        $response = ['message' => 'Unspecified error'];

        if ($this->env === 'dev') {
            $response['message'] = $exception->getMessage();
            $response['exception'] = $this->throwableToArray($exception);
        }

        if ($exception instanceof HttpException) {
            $response['message'] = $exception->getMessage();

            $this->setJsonResponse($event, $response);
            return;
        }

        $this->setJsonResponse($event, $response);
    }

    private function setJsonResponse(ExceptionEvent $event, array $response): void
    {
        $event->setResponse(
            new JsonResponse(
                [
                    'response' => $response
                ],
                Response::HTTP_OK,
                [
                    'Access-Control-Allow-Origin' => '*',
                ]
            )
        );
    }

    private function throwableToArray(\Throwable $throwable): array
    {
        return [
            'code' => $throwable->getCode(),
            'file' => $throwable->getFile() . ':' . $throwable->getLine(),
            'message' => $throwable->getMessage(),
            'trace' => $throwable->getTrace(),
        ];
    }
}
