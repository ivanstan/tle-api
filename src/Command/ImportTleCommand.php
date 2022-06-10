<?php

namespace App\Command;

use App\Entity\Tle;
use App\Repository\TleRepository;
use Doctrine\ORM\EntityManagerInterface;
use GuzzleHttp\Client;
use Ivanstan\SymfonySupport\Traits\FileSystemAwareTrait;
use Ivanstan\Tle\Model\Tle as TleModel;
use Ivanstan\Tle\Model\TleFile;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Yaml\Yaml;

#[AsCommand(
    name: 'tle:import', description: 'Update TLE database', aliases: ['import:tle']
)]
final class ImportTleCommand extends Command
{
    use FileSystemAwareTrait;

    private const BATCH_SIZE = 50;
    private const OPTION_NO_PROGRESS = 'no-progress';

    public const SOURCE = '/etc/custom/source.yaml';

    private array $satellites = [];

    public function __construct(private EntityManagerInterface $em, private TleRepository $repository, private LoggerInterface $logger)
    {
        parent::__construct();
    }

    /** @noinspection PhpMissingParentCallCommonInspection */
    protected function configure(): void
    {
        $this->addOption(self::OPTION_NO_PROGRESS, null, InputOption::VALUE_OPTIONAL, 'Hide progress bar', false);
    }

    /** @noinspection PhpMissingParentCallCommonInspection */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $showProgress = $input->getOption(self::OPTION_NO_PROGRESS) === false;

        $this->satellites = $this->repository->fetchAllIndexed();

        $totalInsert = 0;
        $totalUpdate = 0;

        $sources = Yaml::parseFile($this->getProjectDir() . self::SOURCE);

        if ($showProgress) {
            $progressBar = new ProgressBar($output, \count($sources));
            $progressBar->start();
        }

        foreach ($sources as $uri) {
            /** @noinspection DisconnectedForeachInstructionInspection */
            if (isset($progressBar)) {
                $progressBar->advance();
            }

            try {
                $response = (new Client())->request('GET', $uri);
            } catch (\Exception $exception) {
                $message = \sprintf('Unable to fetch resource "%s" with exception message "%s"', $uri, $exception->getMessage());

                $this->logger->error($message);
                $output->writeln($message);
                continue;
            }

            if (!$response->getBody()) {
                $message = \sprintf('URI "%s" returned empty body, skipping', $uri);

                $this->logger->error($message);
                $output->writeln($message);
                continue;
            }

            $file = new TleFile($response->getBody());

            $insert = [];
            $update = [];

            foreach ($file->parse() as $tle) {
                if ($tle === null) {
                    continue;
                }

                if (\array_key_exists($tle->getId(), $this->satellites)) {
                    $update[$tle->getId()] = $tle;
                } else {
                    $insert[$tle->getId()] = $tle;
                }
            }

            $totalInsert += \count($insert);
            $totalUpdate += \count($update);

            $this->flush($insert, true);
            $this->flush($update);
        }

        if (isset($progressBar)) {
            $progressBar->finish();
        }
        $output->writeln('');
        $output->writeln('');

        $table = new Table($output);
        $table
            ->setHeaders(
                [
                    'Output',
                ]
            )
            ->setStyle('box')
            ->setRows(
                [
                    [
                        'TLE records persisted to database',
                        $totalInsert,
                    ],
                    [
                        'TLE records updated in database',
                        $totalUpdate,
                    ],
                ]
            );
        $table->render();

        return Command::SUCCESS;
    }

    protected function toPersistent(TleModel $model): Tle
    {
        $tle = new Tle();
        $tle->setId($model->getId());
        $tle->setLine1($model->getLine1());
        $tle->setLine2($model->getLine2());
        $tle->setName($model->getName());

        return $tle;
    }

    protected function flush(array $queue, $persistNew = null): void
    {
        $counter = 0;
        /** @var TleModel $model */
        foreach ($queue as $model) {
            if (!$persistNew) {
                /** @var Tle $existing */
                $existing = $this->satellites[$model->getId()];
                $existing->setName($model->getName());
                $existing->setId($model->getId());
                $existing->setLine1($model->getLine1());
                $existing->setLine2($model->getLine2());
            }

            if ($persistNew) {
                $tle = $this->toPersistent($model);
                $this->satellites[$model->getId()] = $tle;
                $this->em->persist($tle);
            }

            if (($counter % self::BATCH_SIZE) === 0) {
                $this->em->flush();
            }
            ++$counter;
        }
        $this->em->flush();
    }
}
