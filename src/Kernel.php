<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    /** @noinspection PhpUnusedPrivateMethodInspection */
    private function getConfigDir(): string
    {
        return $this->getProjectDir().'/etc';
    }
}
