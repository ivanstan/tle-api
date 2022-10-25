<?php

namespace App\Event;

use App\Entity\Request;
use App\Entity\Tle;
use App\Repository\TleRepository;
use App\Service\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class StatisticSubscriber implements EventSubscriberInterface
{
    public const ROUTES = [
        'tle_record',
        'tle_propagate',
        'tle_flyover',
        'tle_flyover_details',
    ];

    public function __construct(private EntityManagerInterface $em, private TleRepository $tleRepository)
    {
    }

    /**
     * @codeCoverageIgnore
     *
     * @return string[]
     */
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::TERMINATE => 'onKernelTerminate',
        ];
    }

    public function onKernelTerminate(TerminateEvent $event): void
    {
        if (!Route::inArray($event->getRequest(), self::ROUTES)) {
            return;
        }

        /** @var Tle|null $tle */
        $tle = $this->tleRepository->find($event->getRequest()->get('id'));

        if (null === $tle) {
            return;
        }

        $request = new Request();
        $request->setTle($tle);
        $request->setIp($event->getRequest()->getClientIp());
        $request->setReferer($event->getRequest()->headers->get('referer'));

        $this->em->persist($request);
        $this->em->flush();
    }
}
