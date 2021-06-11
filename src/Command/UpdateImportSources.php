<?php /** @noinspection HttpUrlsUsage */

namespace App\Command;

use App\Service\Traits\FileSystemAwareTrait;
use DOMElement;
use GuzzleHttp\Client;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\Yaml\Yaml;

final class UpdateImportSources extends Command
{
    use FileSystemAwareTrait;

    private const CATALOG = [
        'https://celestrak.com/NORAD/elements/',
        'https://celestrak.com/NORAD/elements/supplemental/',
    ];

    private const IGNORED = [
        "https://celestrak.com/NORAD/elements/supplemental/starlink-V1.0-20.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/starlink.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/planet.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/oneweb.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/gps.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/glonass.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/meteosat.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/intelsat.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/ses.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/telesat.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/iss.rms.txt",
        "https://nasa-public-data.s3.amazonaws.com/iss-coords/current/ISS_OEM/ISS.OEM_J2K_EPH.txt",
        "https://celestrak.com/NORAD/elements/supplemental/cpf.rms.txt",
        "https://celestrak.com/NORAD/elements/supplemental/testcase/gps_2007_12_31_1300.txt",
        "http://www.ngs.noaa.gov/orbits/sp3c.txt",
        "https://celestrak.com/GPS/almanac/SEM/2007/almanac.sem.week0436.319488.txt",
        "https://celestrak.com/GPS/almanac/SEM/almanac.sem.txt",
    ];

    private SymfonyStyle $io;
    private array $sources = [];

    protected function configure(): void
    {
        $this->setName('tle:source');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->io = new SymfonyStyle($input, $output);

        $sourceFile = $this->getProjectDir() . ImportTleCommand::SOURCE;

        $this->sources = Yaml::parseFile($sourceFile);

        $newSources = $this->getSources();

        $diff = array_diff($newSources, $this->sources);

        if (empty($diff)) {
            $this->io->success('No new tle sources found');

            return Command::SUCCESS;
        }

        $this->io->writeln("");
        $this->io->writeln(\sprintf("Following new tle sources found and written to %s", $sourceFile));
        $this->io->writeln("");
        foreach ($diff as $url) {
            $this->io->writeln($url);
        }

        $this->io->writeln("");

        $sources = array_merge($this->sources, $diff);
        sort($sources);

        $yaml = Yaml::dump($sources);

        file_put_contents($sourceFile, $yaml);

        return Command::SUCCESS;
    }

    protected function getSources(): array
    {
        $result = [];

        foreach (self::CATALOG as $catalog) {
            $response = (new Client())->request('GET', $catalog);

            $crawler = new Crawler($response->getBody()->getContents());

            /** @var DOMElement $anchor */
            foreach ($crawler->filter('a') as $anchor) {
                $href = $anchor->getAttribute('href');
                $path = parse_url($href, PHP_URL_PATH);
                $extension = pathinfo($path, PATHINFO_EXTENSION);

                if ($extension === 'txt') {
                    if (parse_url($href, PHP_URL_HOST) === null) {
                        if ($path[0] === '/') {
                            $scheme = parse_url($catalog, PHP_URL_SCHEME);
                            $host = parse_url($catalog, PHP_URL_HOST);
                            $href = $scheme . '://' . $host . $href;
                        } else {
                            $href = $catalog . trim($href, '/');
                        }
                    }

                    if (!$this->isIgnored($href)) {
                        $this->io->writeln(\sprintf('Verifying url: %s', $href));
                        if ($this->isHealthy($href)) {
                            $result[] = $href;
                        }
                    }
                }
            }
        }

        return $result;
    }

    protected function isIgnored(string $url): bool
    {
        return in_array($url, self::IGNORED, false) || in_array($this->sources, self::IGNORED, false);
    }

    protected function isHealthy(string $url): bool
    {
        try {
            $response = (new Client())->request('GET', $url);

            return $response->getStatusCode() === 200;
        } catch (\Exception) {
            return false;
        }
    }
}
