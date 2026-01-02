<?php

/** @noinspection HttpUrlsUsage */

namespace App\Command;

use DOMElement;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Ivanstan\SymfonySupport\Traits\FileSystemAwareTrait;
use Ivanstan\Tle\Model\TleFile;
use Ivanstan\Tle\Service\Validator;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\Yaml\Yaml;

#[AsCommand(
    name: 'tle:source', description: 'Recursively crawl CelesTrak and update TLE sources'
)]
final class UpdateImportSources extends Command
{
    use FileSystemAwareTrait;

    private const BASE_URLS = [
        'https://celestrak.org/',
    ];

    private const MAX_DEPTH = 5;

    private const IGNORED_PATHS = [
        '/GPS/almanac/',
        '/software/',
        '/publications/',
        '/columns/',
        '/events/',
        '/satcat/',
        '/SpaceData/',
        '/brief-history.php',
        '/webmaster.php',
        '/NORAD/documentation/',
        '/NORAD/archives/',
    ];

    private const IGNORED_EXTENSIONS = [
        'rms',
        'sem',
        'yuma',
        'sp3',
        'oem',
        'csv',
        'json',
        'xml',
        'pdf',
        'zip',
        'gz',
        'png',
        'jpg',
        'jpeg',
        'gif',
        'ico',
        'css',
        'js',
    ];

    private SymfonyStyle $io;
    private array $existingSources = [];
    private array $visitedUrls = [];
    private array $discoveredTleSources = [];
    private Client $client;
    private Validator $validator;
    private int $validatedCount = 0;
    private int $invalidCount = 0;
    private const MAX_RETRIES = 3;
    private const RETRY_DELAY_MS = 1000;

    protected function configure(): void
    {
        $this->addOption('max-depth', 'd', InputOption::VALUE_OPTIONAL, 'Maximum crawl depth', self::MAX_DEPTH);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->io = new SymfonyStyle($input, $output);
        $maxDepth = (int) $input->getOption('max-depth');

        $sourceFile = $this->getProjectDir() . ImportTleCommand::SOURCE;

        $this->existingSources = file_exists($sourceFile) ? Yaml::parseFile($sourceFile) : [];
        $this->client = new Client([
            'timeout' => 60,
            'connect_timeout' => 30,
            'read_timeout' => 60,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
                'Accept-Language' => 'en-US,en;q=0.9',
            ],
            'verify' => true,
            'http_errors' => false,
            'curl' => [
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_SSLVERSION => CURL_SSLVERSION_TLSv1_2,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            ],
        ]);
        $this->validator = new Validator();

        $this->io->title('CelesTrak TLE Source Crawler');
        $this->io->writeln(\sprintf('Starting recursive crawl (max depth: %d)', $maxDepth));
        $this->io->writeln('');

        // Check existing sources and remove unhealthy ones
        $this->io->section('Checking existing sources...');
        $healthySources = $this->filterHealthySources($this->existingSources);
        $removedSources = array_diff($this->existingSources, $healthySources);

        // Crawl CelesTrak recursively from both domains
        $this->io->section('Crawling CelesTrak for TLE sources...');
        foreach (self::BASE_URLS as $baseUrl) {
            $this->io->writeln(\sprintf('Starting from: %s', $baseUrl));
            $this->crawlRecursively($baseUrl, 0, $maxDepth);
        }

        // Merge discovered sources with healthy existing ones (no duplicates)
        $allSources = array_unique(array_merge($healthySources, $this->discoveredTleSources));
        sort($allSources);

        $newSources = array_diff($this->discoveredTleSources, $this->existingSources);

        $this->io->writeln('');
        $this->io->section('Summary');

        // Report statistics
        $this->io->writeln(\sprintf('URLs visited: %d', \count($this->visitedUrls)));
        $this->io->writeln(\sprintf('TLE files validated: %d', $this->validatedCount));
        $this->io->writeln(\sprintf('Invalid/non-TLE files skipped: %d', $this->invalidCount));
        $this->io->writeln('');

        // Report removed sources
        if (!empty($removedSources)) {
            $this->io->warning(\sprintf('%d sources were removed due to errors:', \count($removedSources)));
            foreach ($removedSources as $url) {
                $this->io->writeln('  - ' . $url);
            }
        }

        // Report new sources
        if (!empty($newSources)) {
            $this->io->success(\sprintf('%d new TLE sources discovered:', \count($newSources)));
            foreach ($newSources as $url) {
                $this->io->writeln('  + ' . $url);
            }
        }

        if (empty($newSources) && empty($removedSources)) {
            $this->io->success('No changes to TLE sources');
            return Command::SUCCESS;
        }

        // Write updated sources
        $yaml = Yaml::dump($allSources);
        file_put_contents($sourceFile, $yaml);

        $this->io->success(\sprintf('Updated %s with %d sources', $sourceFile, \count($allSources)));

        return Command::SUCCESS;
    }

    private function crawlRecursively(string $url, int $depth, int $maxDepth): void
    {
        // Normalize URL
        $url = $this->normalizeUrl($url);

        // Skip if already visited or exceeds max depth
        if (isset($this->visitedUrls[$url]) || $depth > $maxDepth) {
            return;
        }

        // Only crawl celestrak URLs
        if (!$this->isCelestrakUrl($url)) {
            return;
        }

        // Skip ignored paths
        if ($this->isIgnoredPath($url)) {
            return;
        }

        $this->visitedUrls[$url] = true;

        $this->io->writeln(\sprintf('[Depth %d] Crawling: %s', $depth, $url), OutputInterface::VERBOSITY_VERBOSE);

        try {
            $response = $this->fetchWithRetry($url);
            
            if ($response === null || $response->getStatusCode() !== 200) {
                $this->io->writeln(\sprintf('  Failed to fetch %s (status: %s)', $url, $response?->getStatusCode() ?? 'null'), OutputInterface::VERBOSITY_VERBOSE);
                return;
            }
            
            $contentType = $response->getHeaderLine('Content-Type');
            $body = $response->getBody()->getContents();

            // First, check if this URL looks like it could be a TLE endpoint
            if ($this->isPotentialTleEndpoint($url, $contentType)) {
                if ($this->validateTleContent($body, $url)) {
                    $this->discoveredTleSources[] = $url;
                    $this->validatedCount++;
                    $this->io->writeln(\sprintf('  ✓ Valid TLE source: %s', $url));
                    return;
                } else {
                    $this->invalidCount++;
                    $this->io->writeln(\sprintf('  ✗ Not a valid TLE source: %s', $url), OutputInterface::VERBOSITY_VERBOSE);
                }
            }

            // If it's HTML, extract and follow links
            if (str_contains($contentType, 'text/html')) {
                $this->extractAndFollowLinks($body, $url, $depth, $maxDepth);
            }
        } catch (GuzzleException $e) {
            $this->io->writeln(\sprintf('  Error fetching %s: %s', $url, $e->getMessage()));
        } catch (\Exception $e) {
            $this->io->writeln(\sprintf('  Error processing %s: %s', $url, $e->getMessage()), OutputInterface::VERBOSITY_VERBOSE);
        }
    }

    private function extractAndFollowLinks(string $html, string $baseUrl, int $depth, int $maxDepth): void
    {
        $crawler = new Crawler($html);

        /** @var DOMElement $anchor */
        foreach ($crawler->filter('a') as $anchor) {
            $href = $anchor->getAttribute('href');

            if (empty($href) || str_starts_with($href, '#') || str_starts_with($href, 'javascript:') || str_starts_with($href, 'mailto:')) {
                continue;
            }

            $absoluteUrl = $this->resolveUrl($href, $baseUrl);

            if ($absoluteUrl) {
                // Check if this looks like a TLE endpoint based on URL pattern
                if ($this->isTleUrlPattern($absoluteUrl)) {
                    // Directly try to validate as TLE
                    $this->tryValidateTleUrl($absoluteUrl);
                } else {
                    // Continue crawling
                    $this->crawlRecursively($absoluteUrl, $depth + 1, $maxDepth);
                }
            }
        }
    }

    private function tryValidateTleUrl(string $url): void
    {
        $url = $this->normalizeUrl($url);

        if (isset($this->visitedUrls[$url])) {
            return;
        }

        if (!$this->isCelestrakUrl($url)) {
            return;
        }

        $this->visitedUrls[$url] = true;

        try {
            $response = $this->fetchWithRetry($url);
            
            if ($response === null || $response->getStatusCode() !== 200) {
                $this->io->writeln(\sprintf('  Failed to fetch TLE from %s', $url), OutputInterface::VERBOSITY_VERBOSE);
                return;
            }
            
            $body = $response->getBody()->getContents();

            if ($this->validateTleContent($body, $url)) {
                $this->discoveredTleSources[] = $url;
                $this->validatedCount++;
                $this->io->writeln(\sprintf('  ✓ Valid TLE source: %s', $url));
            } else {
                $this->invalidCount++;
                $this->io->writeln(\sprintf('  ✗ Not a valid TLE source: %s', $url), OutputInterface::VERBOSITY_VERBOSE);
            }
        } catch (\Exception $e) {
            $this->io->writeln(\sprintf('  Error validating %s: %s', $url, $e->getMessage()), OutputInterface::VERBOSITY_VERBOSE);
        }
    }

    private function isTleUrlPattern(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';
        $query = parse_url($url, PHP_URL_QUERY) ?? '';
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        // .txt files are potential TLE sources
        if ($extension === 'txt') {
            return true;
        }

        // URLs with FORMAT=tle or FORMAT=TLE query parameter
        if (preg_match('/FORMAT=tle/i', $query)) {
            return true;
        }

        // gp.php endpoints with GROUP parameter
        if (str_contains($path, 'gp.php') && str_contains($query, 'GROUP=')) {
            return true;
        }

        return false;
    }

    private function resolveUrl(string $href, string $baseUrl): ?string
    {
        // Already absolute URL
        if (str_starts_with($href, 'http://') || str_starts_with($href, 'https://')) {
            return $href;
        }

        $parsed = parse_url($baseUrl);
        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'] ?? '';

        if (empty($host)) {
            return null;
        }

        // Absolute path
        if (str_starts_with($href, '/')) {
            return $scheme . '://' . $host . $href;
        }

        // Relative path
        $basePath = $parsed['path'] ?? '/';
        if (!str_ends_with($basePath, '/')) {
            $basePath = dirname($basePath) . '/';
        }

        return $scheme . '://' . $host . $basePath . $href;
    }

    private function normalizeUrl(string $url): string
    {
        // Remove fragments
        $url = preg_replace('/#.*$/', '', $url);

        // Parse the URL
        $parsed = parse_url($url);
        
        // Rebuild without trailing slash on path (except for root)
        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'] ?? '';
        $path = $parsed['path'] ?? '/';
        $query = $parsed['query'] ?? '';
        
        // Remove trailing slash from path (except root)
        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }
        
        $normalized = $scheme . '://' . $host . $path;
        if (!empty($query)) {
            $normalized .= '?' . $query;
        }

        return $normalized;
    }

    private function isCelestrakUrl(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);
        return in_array($host, ['celestrak.com', 'www.celestrak.com', 'celestrak.org', 'www.celestrak.org'], true);
    }

    private function isIgnoredPath(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';

        foreach (self::IGNORED_PATHS as $ignoredPath) {
            if (str_starts_with($path, $ignoredPath)) {
                return true;
            }
        }

        // Check for ignored file extensions
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (in_array($extension, self::IGNORED_EXTENSIONS, true)) {
            return true;
        }

        return false;
    }

    private function isPotentialTleEndpoint(string $url, string $contentType): bool
    {
        // Must return text content
        if (!str_contains($contentType, 'text/plain') && 
            !str_contains($contentType, 'application/octet-stream') &&
            !str_contains($contentType, 'text/html')) {
            // Some servers might not set proper content type, so we'll check anyway for known patterns
        }

        return $this->isTleUrlPattern($url);
    }

    private function validateTleContent(string $content, string $url): bool
    {
        $content = trim($content);
        
        if (empty($content)) {
            return false;
        }

        // Quick sanity check: TLE lines start with "1 " and "2 "
        // and are typically 69 characters long
        if (!preg_match('/^1 /m', $content) || !preg_match('/^2 /m', $content)) {
            return false;
        }

        try {
            $file = new TleFile($content);
            $tles = $file->parse();

            if (empty($tles)) {
                return false;
            }

            // Validate at least a few TLEs to confirm this is a valid TLE file
            $validCount = 0;
            $totalChecked = 0;
            $maxCheck = min(5, \count($tles)); // Check up to 5 TLEs

            foreach ($tles as $tle) {
                if ($tle === null) {
                    continue;
                }

                $totalChecked++;

                try {
                    if ($this->validator->validate($tle)) {
                        $validCount++;
                    }
                } catch (\Exception) {
                    // Invalid TLE
                }

                if ($totalChecked >= $maxCheck) {
                    break;
                }
            }

            // Consider valid if at least 1 TLE validated successfully
            return $validCount > 0;
        } catch (\Exception $e) {
            $this->io->writeln(\sprintf('  Validation error for %s: %s', $url, $e->getMessage()), OutputInterface::VERBOSITY_VERY_VERBOSE);
            return false;
        }
    }

    private function isHealthy(string $url): bool
    {
        try {
            $response = $this->fetchWithRetry($url);

            if ($response === null || $response->getStatusCode() !== 200) {
                return false;
            }

            // Also validate TLE content
            return $this->validateTleContent($response->getBody()->getContents(), $url);
        } catch (\Exception) {
            return false;
        }
    }

    private function fetchWithRetry(string $url, array $options = []): ?\Psr\Http\Message\ResponseInterface
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= self::MAX_RETRIES; $attempt++) {
            try {
                $response = $this->client->request('GET', $url, $options);
                
                // Check for successful response
                if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 400) {
                    return $response;
                }
                
                // For 4xx/5xx errors, don't retry
                if ($response->getStatusCode() >= 400) {
                    return $response;
                }
            } catch (GuzzleException $e) {
                $lastException = $e;
                $this->io->writeln(
                    \sprintf('  Attempt %d/%d failed for %s: %s', $attempt, self::MAX_RETRIES, $url, $e->getMessage()),
                    OutputInterface::VERBOSITY_VERY_VERBOSE
                );
                
                if ($attempt < self::MAX_RETRIES) {
                    // Wait before retrying with exponential backoff
                    usleep(self::RETRY_DELAY_MS * 1000 * $attempt);
                }
            }
        }

        if ($lastException) {
            throw $lastException;
        }

        return null;
    }

    private function filterHealthySources(array $sources): array
    {
        $healthySources = [];

        foreach ($sources as $url) {
            $this->io->write(\sprintf('  Checking: %s ... ', $url));

            if ($this->isHealthy($url)) {
                $healthySources[] = $url;
                $this->io->writeln('<info>OK</info>');
            } else {
                $this->io->writeln('<error>FAILED</error>');
            }
        }

        return $healthySources;
    }
}
