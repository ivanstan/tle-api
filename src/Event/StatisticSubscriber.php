<?php

namespace App\Event;

use App\Entity\Request;
use App\Entity\Tle;
use App\Repository\StatisticRepository;
use App\Repository\TleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class StatisticSubscriber implements EventSubscriberInterface
{
    protected const TLE_ROUTES = [
      'tle_propagate',
      'tle_pass',
      'tle_record'
    ];

    public function __construct(private StatisticRepository $statisticRepository, private EntityManagerInterface $em, private TleRepository $tleRepository)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::TERMINATE => 'onKernelTerminate',
        ];
    }

    public function onKernelTerminate($event): void
    {
        if (!in_array($event->getRequest()->get('_route'), self::TLE_ROUTES, false)) {
            return;
        }

        /** @var Tle|null $tle */
        $tle = $this->tleRepository->find($event->getRequest()->get('id'));

        if ($tle === null) {
            return;
        }

        $request = new Request();
        $request->setTle($tle);
        $request->setIp($event->getRequest()->getClientIp());

        $this->em->persist($request);

        $this->em->flush();

        $statistics = $this->statisticRepository->find((int)$event->getRequest()->get('id'));

        if ($statistics === null) {
            return;
        }

        $statistics->incrementHits();

        $this->em->flush();
    }
}
