<?php

namespace App\Service;

use App\Request\AbstractRequest;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ArgumentValueResolverInterface;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;

class CustomRequestResolver implements ArgumentValueResolverInterface
{
    public function supports(Request $request, ArgumentMetadata $argument): bool
    {
        return Request::class === $argument->getType() || is_subclass_of($argument->getType(), Request::class);
    }

    public function resolve(Request $request, ArgumentMetadata $argument): iterable
    {
        /** @var AbstractRequest $customRequest */
        $customRequest = forward_static_call([$argument->getType(), 'createFromGlobals']);
        $customRequest->attributes = $request->attributes;

        yield $customRequest;
    }
}
