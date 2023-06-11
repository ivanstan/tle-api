<?php

namespace App\Command;

use App\Entity\Tle;
use App\Entity\TleInformation;
use App\Entity\TleStat;
use App\Repository\TleInformationRepository;
use App\Repository\TleStatRepository;
use Doctrine\ORM\EntityManagerInterface;
use Ivanstan\Tle\Specification\GeostationaryOrbitTleSpecification;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'tle:calculate', description: 'Calculate and persist data in TleInformation entity'
)]
final class TleCalculate extends Command
{
    protected const BATCH_SIZE = 20;
    protected const OPTION_TLE = 'tle';

    public function __construct(protected EntityManagerInterface $entityManager, protected TleStatRepository $statRepository, protected TleInformationRepository $infoRepository)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(self::OPTION_TLE, 't', InputOption::VALUE_REQUIRED, 'Calculate only for specified record');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $builder = $this->entityManager
            ->createQueryBuilder()
            ->select('tle')
            ->from(Tle::class, 'tle');

        $tle = $input->getOption(self::OPTION_TLE);

        if (null !== $tle) {
            $builder->andWhere('tle.id = :tle');
            $builder->setParameter('tle', $tle);
        }

        $repository = $this->entityManager->getRepository(TleInformation::class);

        /** @var Tle $tle */
        foreach ($builder->getQuery()->toIterable() as $i => $tle) {
            $exists = true;

            $tleInformation = $repository->find($tle->getId());

            if (null === $tleInformation) {
                $exists = false;
                $tleInformation = new TleInformation($tle);
            }

            $tleModel = new \Ivanstan\Tle\Model\Tle($tle->getLine1(), $tle->getLine2(), $tle->getName());

            $tleInformation->inclination = $tleModel->getInclination();
            $tleInformation->eccentricity = $tleModel->eccentricity();
            $tleInformation->period = $tleModel->period();

            if ($tleModel->meanMotion() > 0) {
                $tleInformation->period = $tleModel->period();
            } else {
                $output->writeln(sprintf('Satellite %d has mean motion problem', $tle->getId()));
            }

            $tleInformation->geostationary = (new GeostationaryOrbitTleSpecification())->isSatisfiedBy($tleModel);
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

    protected function calculateStats(): void
    {
        $this->statRepository->update(TleStat::MAX_E, $this->infoRepository->getMaxEccentricity());
        $this->statRepository->update(TleStat::MAX_I, $this->infoRepository->getMaxInclination());
        $this->statRepository->update(TleStat::MAX_P, $this->infoRepository->getMaxPeriod());
        $this->statRepository->update(TleStat::MIN_P, $this->infoRepository->getMinPeriod());
    }
}
