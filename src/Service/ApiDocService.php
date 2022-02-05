<?php

namespace App\Service;

use Ivanstan\SymfonySupport\Traits\FileSystemAwareTrait;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Contracts\Cache\CacheInterface;

class ApiDocService
{
    use FileSystemAwareTrait;

    public function __construct(protected ParameterBagInterface $bag, private CacheInterface $cache)
    {
    }

    public function getDocs(string $file): array {
        $docs = json_decode(
            file_get_contents($this->getProjectDir(). $file),
            true,
            JSON_THROW_ON_ERROR,
            JSON_THROW_ON_ERROR
        );

        $docs['info']['version'] = $this->bag->get('version');

        return $docs;
    }
}
