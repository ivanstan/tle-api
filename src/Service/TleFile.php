<?php

namespace App\Service;

use App\ViewModel\Model\TleModel;

class TleFile
{
    protected string $content;

    public function __construct(string $content)
    {
        $this->content = $content;
    }

    /**
     * @return TleModel[]
     */
    public function parse(): array
    {
        $data = explode("\n", $this->content);
        $data = array_filter($data);
        $raw = array_chunk($data, 3);

        $result = [];
        foreach ($raw as $key => $item) {
            if (!isset($item[0], $item[1], $item[2])) {
                $result[$key] = null;
                continue;
            }

            $result[$key] = new TleModel($this->trim($item[1]), $this->trim($item[2]), $this->trim($item[0]));
        }

        return $result;
    }

    protected function trim(string $string): string
    {
        $string = str_replace(["/\r\n/", "/\r/", "/\n/"], '', $string);

        return trim($string);
    }
}