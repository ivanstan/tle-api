<?php /** @noinspection SummerTimeUnsafeTimeManipulationInspection */

namespace App\ViewModel\Model;

use App\Field\NameField;
use App\Field\TleField;

class TleModel
{
    public const LINE1 = 1;
    public const LINE2 = 2;

    public const SATELLITE_UNCLASSIFIED = 'U';
    public const SATELLITE_CLASSIFIED = 'C';
    public const SATELLITE_SECRET = 'S';

    use NameField;
    use TleField;

    public function __construct(string $line1, string $line2, string $name = null)
    {
        $this->line1 = $line1;
        $this->line2 = $line2;
        $this->name = $name;
    }

    public function getId(): int
    {
        return (int)substr($this->line1, 2, 6);
    }

    public function getClassification(): string
    {
        return $this->line1[7];
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function launchYear($fourDigits = true): int
    {
        $year = (int)trim(substr($this->line1, 9, 2));

        if ($fourDigits) {
            $this->formatYear($year);
        }

        return $year;
    }

    public function launchNumberOfYear(): int
    {
        return (int)trim(substr($this->line1, 12, 2));
    }

    public function epoch(): string
    {
        return trim(substr($this->line1, 18, 14));
    }

    public function launchPiece(): string
    {
        return trim(substr($this->line1, 14, 2));
    }

    public function bstar(): string
    {
        return trim(substr($this->line1, 53, 8));
    }

    public function elementNumber(): int
    {
        return (int)trim(substr($this->line1, 64, 4));
    }

    public function inclination(): float
    {
        return (float)trim(substr($this->line2, 8, 8));
    }

    public function raan(): float
    {
        return (float)trim(substr($this->line2, 17, 8));
    }

    public function eccentricity(): float
    {
        return (float)('.' . trim(substr($this->line2, 26, 7)));
    }

    public function meanAnomaly(): float
    {
        return (float)trim(substr($this->line2, 43, 8));
    }

    public function argumentOfPerigee(): float
    {
        return (float)trim(substr($this->line2, 34, 8));
    }

    public function meanMotion(): float
    {
        return (float)trim(substr($this->line2, 52, 11));
    }

    public function getDate(): string
    {
        $year = (int)trim(substr($this->line1, 18, 2));
        $year = $this->formatYear($year);

        $date = new \DateTime();
        $timezone = new \DateTimeZone('UTC');

        $epoch = (float)trim(substr($this->line1, 20, 12));
        $days = (int)$epoch;

        $date
            ->setTimezone($timezone)
            ->setDate($year, 1, $days);

        $faction = round($epoch - $days, 8);

        $faction *= 24; // hours
        $hours = round($faction);
        $faction -= $hours;

        $faction *= 60; // minutes
        $minutes = round($faction);
        $faction -= $minutes;

        $faction *= 60; // seconds
        $seconds = round($faction);
        $faction -= $seconds;

        $faction *= 1000; // milliseconds
        $milliseconds = round($faction);

        $date->setTime($hours, $minutes, $seconds, $milliseconds);

        return $date->format('c');
    }

    public function getChecksum(int $lineNumber): int
    {
        $line = $this->getLineByNumber($lineNumber);

        return (int)trim(substr($line, 68));
    }

    public function calculateChecksum(int $lineNumber): int
    {
        $line = $this->getLineByNumber($lineNumber);

        return $this->checksum($line);
    }

    public function verify(): bool
    {
        if (self::LINE1 !== (int)$this->line1[0] || self::LINE2 !== (int)$this->line2[0]) {
            return false;
        }

        if ($this->getChecksum(self::LINE1) !== $this->calculateChecksum(self::LINE1)) {
            return false;
        }

        if ($this->getChecksum(self::LINE2) !== $this->calculateChecksum(self::LINE2)) {
            return false;
        }

        return true;
    }

    private function formatYear(int $twoDigitYear): int
    {
        if ($twoDigitYear < 57) {
            $twoDigitYear += 2000;
        } else {
            $twoDigitYear += 1900;
        }

        return $twoDigitYear;
    }

    private function getLineByNumber(int $lineNumber): string
    {
        if (self::LINE1 === $lineNumber) {
            return $this->line1;
        }

        if (self::LINE2 === $lineNumber) {
            return $this->line2;
        }

        throw new \InvalidArgumentException(\sprintf('Invalid line number %d', $lineNumber));
    }

    private function checksum(string $line): int
    {
        $line = substr($line, 0, -1); // remove checksum
        $length = \strlen($line);
        $sum = 0;
        for ($i = 0; $i < $length; $i++) {
            if ($line[$i] === '-') {
                ++$sum;
                continue;
            }

            if (is_numeric($line[$i])) {
                $sum += $line[$i];
            }
        }
        return $sum % 10;
    }
}
