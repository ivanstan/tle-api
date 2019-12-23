<?php

namespace App\Service;

class CsvReader
{
    private $handle;

    public function __construct(string $filename, string $mode = null)
    {
        $this->filename = $filename;
        $this->handle = fopen($filename, $mode ?? 'rb');
    }

    public function get(): \Generator
    {
        while (($data = fgetcsv($this->handle)) !== false) {
            yield $data;
        }
    }

    public function count(): int
    {
        return \count(file($this->filename));
    }

    public function __destruct()
    {
        fclose($this->handle);
    }
}