<?php

namespace App\Command;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\Service\CsvReader;
use App\Service\TleFile;
use App\Service\Traits\FileSystemAwareTrait;
use App\ViewModel\Model\TleModel;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class ImportTleCommand extends Command
{
    use FileSystemAwareTrait;

    private const BATCH_SIZE = 50;
    private const SOURCE = '/config/custom/source.csv';

    private EntityManagerInterface $em;
    private TleRepository $repository;
    private OutputInterface $output;

    private array $satellites = [];

    public function __construct(EntityManagerInterface $em, TleRepository $repository)
    {
        parent::__construct();
        $this->em = $em;
        $this->repository = $repository;
    }

    protected function configure(): void
    {
        $this->setName('import:tle');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->output = $output;
        $this->satellites = $this->repository->fetchAllIndexed();

        $totalInsert = 0;
        $totalUpdate = 0;

        $csv = new CsvReader($this->getProjectDir() . self::SOURCE);

        $progressBar = new ProgressBar($output, $csv->count());
        $progressBar->start();

        foreach ($csv->get() as $source) {
            $file = new TleFile(file_get_contents($source[0]));

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
            $progressBar->advance();
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
        foreach ($queue as $model) {
            $tle = $this->toPersistent($model);
            $this->satellites[$model->getId()] = $tle;

            if ($persistNew) {
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
