<?php

namespace App\Command;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\Service\Traits\FileSystemAwareTrait;
use Doctrine\ORM\EntityManagerInterface;
use GuzzleHttp\Client;
use Ivanstan\Tle\Model\Tle as TleModel;
use Ivanstan\Tle\Model\TleFile;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Yaml\Yaml;

final class ImportTleCommand extends Command
{
    use FileSystemAwareTrait;

    private const BATCH_SIZE = 50;
    private const SOURCE = '/config/custom/source.yaml';

    private EntityManagerInterface $em;
    private TleRepository $repository;

    private array $satellites = [];

    public function __construct(EntityManagerInterface $em, TleRepository $repository)
    {
        parent::__construct();
        $this->em = $em;
        $this->repository = $repository;
    }

    /** @noinspection PhpMissingParentCallCommonInspection */
    protected function configure(): void
    {
        $this->setName('import:tle');
    }

    /** @noinspection PhpMissingParentCallCommonInspection */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->satellites = $this->repository->fetchAllIndexed();

        $totalInsert = 0;
        $totalUpdate = 0;

        $sources = Yaml::parseFile($this->getProjectDir() . self::SOURCE);

        $progressBar = new ProgressBar($output, \count($sources));
        $progressBar->start();

        foreach ($sources as $uri) {
            /** @noinspection DisconnectedForeachInstructionInspection */
            $progressBar->advance();

            try {
                $response = (new Client())->request('GET', $uri);
            } catch (\Exception $exception) {
                $output->writeln(
                    \sprintf(
                        'Unable to fetch resource "%s" with exception message "%s"',
                        $uri,
                        $exception->getMessage()
                    )
                );
                continue;
            }

            if (!$response->getBody()) {
                continue;
            }

            $file = new TleFile($response->getBody());

            $insert = [];
            $update = [];

            foreach ($file->parse() as $tle) {
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

        $progressBar->finish();
        $output->writeln('');
        $output->writeln('');

        $table = new Table($output);
        $table
            ->setHeaders([
                'Output'
            ])
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

        return 0;
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
