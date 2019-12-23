<?php

namespace App\Service\Traits;

use App\Service\FileManager;

trait FileSystemAwareTrait
{
    private FileManager $fileManager;

    /**
     * @required
     */
    public function setFileManager(FileManager $manager): void
    {
        $this->fileManager = $manager;
    }

    public function getProjectDir(): string
    {
        return $this->fileManager->getProjectDir();
    }
}
