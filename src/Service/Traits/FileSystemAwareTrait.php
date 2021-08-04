<?php

namespace App\Service\Traits;

use App\Service\FileManager;
use Symfony\Contracts\Service\Attribute\Required;

trait FileSystemAwareTrait
{
    private FileManager $fileManager;

    #[Required]
    public function setFileManager(FileManager $manager): void
    {
        $this->fileManager = $manager;
    }

    public function getProjectDir(): string
    {
        return $this->fileManager->getProjectDir();
    }
}
