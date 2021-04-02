<?php

namespace App\Command;

use App\Entity\Tle;
use App\Entity\TleInformation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class TleCalculate extends Command
{
    protected const BATCH_SIZE = 20;

    protected static $defaultName = 'tle:calculate';

    public function __construct(protected EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure()
    {
        $this->setDescription('Calculate and persist data in TleInformation entity');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $builder = $this->entityManager
            ->createQueryBuilder()
            ->select('tle')
            ->from(Tle::class, 'tle');

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
