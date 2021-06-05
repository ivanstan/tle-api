<?php

namespace App\Command;

use App\Entity\Tle;
use App\Entity\TleInformation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

final class TleCalculate extends Command
{
    protected const BATCH_SIZE = 20;
    protected const OPTION_TLE = 'tle';

    protected static $defaultName = 'tle:calculate';

    public function __construct(protected EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure()
    {
        $this->setDescription('Calculate and persist data in TleInformation entity');
        $this->addOption(self::OPTION_TLE, 't', InputOption::VALUE_REQUIRED, 'Calculate only for specified record');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $builder = $this->entityManager
            ->createQueryBuilder()
            ->select('tle')
            ->from(Tle::class, 'tle');

        $tle = $input->getOption(self::OPTION_TLE);

        if ($tle !== null) {
            $builder->andWhere('tle.id = :tle');
            $builder->setParameter('tle', $tle);
        }

        $repository = $this->entityManager->getRepository(TleInformation::class);

        /** @var Tle $tle */
        foreach ($builder->getQuery()->toIterable() as $i => $tle) {
            $exists = true;

            $tleInformation = $repository->find($tle->getId());

            if ($tleInformation === null) {
                $exists = false;
                $tleInformation = new TleInformation($tle);
            }

            $tleModel = new \Ivanstan\Tle\Model\Tle($tle->getLine1(), $tle->getLine2(), $tle->getName());

            $tleInformation->inclination = $tleModel->getInclination();
            $tleInformation->eccentricity = $tleModel->eccentricity();
            $tleInformation->period = $tleModel->period();
            $tleInformation->geostationary = $tleModel->isGeostationary();
            $tleInformation->raan = $tleModel->raan();
            $tleInformation->semiMajorAxis = $tleModel->semiMajorAxis();

            if (!$exists) {
                $this->entityManager->persist($tleInformation);
            }

            if (($i % self::BATCH_SIZE) === 0) {
                $this->entityManager->flush();
                $this->entityManager->clear();
            }
        }

        $this->entityManager->flush();

        return Command::SUCCESS;
    }
}
