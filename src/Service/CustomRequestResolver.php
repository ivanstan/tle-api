<?php

namespace App\Service;

use App\Request\AbstractRequest;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ArgumentValueResolverInterface;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class CustomRequestResolver implements ArgumentValueResolverInterface
{
    public function __construct(protected ValidatorInterface $validator)
    {
    }

    public function supports(Request $request, ArgumentMetadata $argument): bool
    {
        return Request::class === $argument->getType() || is_subclass_of($argument->getType(), Request::class);
    }

    public function resolve(Request $request, ArgumentMetadata $argument): iterable
    {
        /** @var AbstractRequest $customRequest */
        $customRequest = forward_static_call([$argument->getType(), 'createFromGlobals']);
        $customRequest->attributes = $request->attributes;
        $customRequest->query = $request->query;
        $customRequest->files = $request->files;
        $customRequest->request = $request->request;

        if (method_exists($customRequest, 'validate')) {
            $violations = $customRequest->validate($this->validator);

            /**
             * ToDo: Messages should be combined and well formatted.
             */
            if ($violations !== null && $violations->has(0)) {
                $violation = $violations->get(0);

                $message = $violation->getPropertyPath() . ' ' . $violation->getMessage();

                throw new BadRequestHttpException($message);
            }
        }

        yield $customRequest;
    }
}
