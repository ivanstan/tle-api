<?php

namespace App\Event;

use App\Attributes\RequestValidator;
use ReflectionClass;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validation;

class RequestValidatorSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::CONTROLLER => 'onController',
        ];
    }

    public function onController(ControllerEvent $event): void
    {
        $controller = $event->getController();

        $reflection = new ReflectionClass($controller[0]::class);
        $attributes = $reflection->getMethod($controller[1])->getAttributes();

        foreach ($attributes as $attribute) {
            if ($attribute->getName() === RequestValidator::class) {
                $this->validate($event->getRequest(), $attribute->getArguments());
            }
        }
    }

    public function validate(Request $request, array $arguments): void {
        $validator = Validation::createValidator();
        $constraints = $arguments[0] ?? [];

        $violations = new ConstraintViolationList();

        foreach ($request->query->all() as $name => $value) {
            if (!isset($constraints[$name])) {
                continue;
            }

            $validators = [];

            foreach ($constraints[$name] as $class => $params) {
                $validators[] = new $class($params);
            }

            $violations->addAll($validator->validate($value, $validators));
        }

        if ($violations->has(0)) {
            throw new BadRequestHttpException($violations->get(0)->getMessage());
        }
    }
}
