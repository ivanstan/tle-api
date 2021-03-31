<?php

namespace App\Event;

use App\Entity\Tle;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;

final class TleEntitySubscriber implements EventSubscriber
{
    public function getSubscribedEvents(): array
    {
        return [
            Events::postPersist,
            Events::postUpdate,
        ];
    }

    public function postUpdate(LifecycleEventArgs $args): void
    {
        $this->calculateFields($args);
    }

    public function postPersist(LifecycleEventArgs $args): void
    {
        $this->calculateFields($args);
    }

    protected function calculateFields(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Tle) {
            return;
        }

        $entityManager = $args->getObjectManager();
    }


}
