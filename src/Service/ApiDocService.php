<?php

namespace App\Service;

use Ivanstan\SymfonySupport\Traits\FileSystemAwareTrait;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class ApiDocService
{
    use FileSystemAwareTrait;

    protected FilesystemAdapter $cache;

    public function __construct(protected ParameterBagInterface $bag)
    {
        $this->cache = new FilesystemAdapter();
    }

    public function get(string $file): array
    {
        $result = $this->cache->getItem('tle_api_doc');
        $result->expiresAfter(new \DateInterval('PT30M'));

        if ($result->isHit()) {
            return $result->get();
        }

        $data = $this->build($file);

        $result->set($data);

        return $data;
    }

    protected function build(string $file): array
    {
        $docs = json_decode(
            file_get_contents($this->getProjectDir().$file),
            true,
            JSON_THROW_ON_ERROR,
            JSON_THROW_ON_ERROR
        );

        $docs['info']['version'] = $this->bag->get('version');

        return $docs;
    }
}
