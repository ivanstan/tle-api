<?php

namespace App\Event;

use App\Service\FeatureFlag;
use App\Service\Route;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

class ApiLimiterSubscriber implements EventSubscriberInterface
{
    public const ROUTES = [
        'tle_record',
        'tle_propagate',
        'tle_flyover',
        'tle_flyover_details',
        'tle_collection',
    ];

    protected RateLimiterFactory $limiter;

    public function __construct(RateLimiterFactory $anonymousApiLimiter)
    {
        $this->limiter = $anonymousApiLimiter;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => 'onRequest',
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        $refererHost = parse_url($event->getRequest()->headers->get('referer'), PHP_URL_HOST);
        
        if (!FeatureFlag::API_RATE_LIMITER || $refererHost === Route::PRODUCTION_HOST || !Route::inArray($event->getRequest(), self::ROUTES)) {
            return;
        }

        $limit = $this->limiter->create($event->getRequest()->getClientIp())->consume();

        if (false === $limit->isAccepted()) {
            $headers = [
                'X-RateLimit-Remaining' => $limit->getRemainingTokens(),
                'X-RateLimit-Retry-After' => $limit->getRetryAfter()->format(\DateTimeInterface::ATOM),
                'X-RateLimit-Limit' => $limit->getLimit(),
            ];

            $event->setResponse(
                new JsonResponse(
                    [
                        'response' => [
                            'message' => \sprintf('Too many requests. Retry after %s.', $limit->getRetryAfter()->format(\DateTimeInterface::ATOM)),
                            'limit' => $limit->getLimit(),
                            'remaining' => $limit->getRemainingTokens(),
                        ],
                    ],
                    Response::HTTP_TOO_MANY_REQUESTS,
                    $headers
                ),
            );
        }
    }
}
