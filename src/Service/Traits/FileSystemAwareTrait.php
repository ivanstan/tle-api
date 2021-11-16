<?php

namespace App\Service\Traits;

use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Contracts\Service\Attribute\Required;

trait FileSystemAwareTrait
{
    private ParameterBagInterface $parameters;

    #[Required]
    public function setFileManager(ParameterBagInterface $parameters): void
    {
        $this->parameters = $parameters;
    }

    public function getProjectDir(): string
    {
        return $this->parameters->get('kernel.project_dir');
    }
}
