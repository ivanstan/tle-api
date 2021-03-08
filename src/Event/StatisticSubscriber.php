<?php

namespace App\Event;

use App\Repository\StatisticRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class StatisticSubscriber implements EventSubscriberInterface
{
    public function __construct(private StatisticRepository $statisticRepository, private EntityManagerInterface $em)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelTerminate',
        ];
    }

    public function onKernelTerminate($event): void
    {
        if ($event->getRequest()->get('_route') !== 'tle_record') {
            return;
        }

        $statistics = $this->statisticRepository->find((int)$event->getRequest()->get('id'));

        if ($statistics === null) {
            return;
        }

        $statistics->incrementHits();

        $this->em->flush();
    }
}
