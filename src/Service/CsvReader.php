<?php

namespace App\Service;

class CsvReader
{
    private string $filename;
    private $handle;

    public function __construct(string $filename, string $mode = null)
    {
        if (!file_exists($filename)) {
            throw new \RuntimeException(\sprintf('File "%s" not found.', $filename));
        }

        $this->filename = $filename;
        $this->handle = fopen($filename, $mode ?? 'rb');

        if ($this->handle === false) {
            throw new \RuntimeException(\sprintf('Unable to open "%s" file.', $filename));
        }
    }

    public function get(): \Generator
    {
        while (($data = fgetcsv($this->handle)) !== false) {
            yield $data;
        }
    }

    public function batch(int $size): ?\Generator
    {
        $chunk = [];

        $counter = 1;
        foreach ($this->get() as $line) {
            $chunk[] = $line;
            $counter++;

            if (($counter % $size) === 0) {
                yield $chunk;
                $chunk = [];
            }
        }

        yield $chunk;
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