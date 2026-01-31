<?php

namespace App\Command;

use App\Entity\Tle;
use App\Entity\TleInformation;
use App\Entity\TleStat;
use App\Repository\TleInformationRepository;
use App\Repository\TleStatRepository;
use Doctrine\ORM\EntityManagerInterface;
use Ivanstan\Tle\Specification\CircularOrbitTleSpecification;
use Ivanstan\Tle\Specification\ClassifiedSatelliteTleSpecification;
use Ivanstan\Tle\Specification\CriticalInclinationOrbitTleSpecification;
use Ivanstan\Tle\Specification\DecayingOrbitTleSpecification;
use Ivanstan\Tle\Specification\EllipticalOrbitTleSpecification;
use Ivanstan\Tle\Specification\GeostationaryOrbitTleSpecification;
use Ivanstan\Tle\Specification\GeosynchronousOrbitTleSpecification;
use Ivanstan\Tle\Specification\HighEarthOrbitTleSpecification;
use Ivanstan\Tle\Specification\LowDragTleSpecification;
use Ivanstan\Tle\Specification\LowEarthOrbitTleSpecification;
use Ivanstan\Tle\Specification\MediumEarthOrbitTleSpecification;
use Ivanstan\Tle\Specification\MolniyaOrbitTleSpecification;
use Ivanstan\Tle\Specification\PolarOrbitTleSpecification;
use Ivanstan\Tle\Specification\PosigradeOrbitTleSpecification;
use Ivanstan\Tle\Specification\RecentTleTleSpecification;
use Ivanstan\Tle\Specification\RetrogradeOrbitTleSpecification;
use Ivanstan\Tle\Specification\SunSynchronousOrbitTleSpecification;
use Ivanstan\Tle\Specification\TundraOrbitTleSpecification;
use Ivanstan\Tle\Specification\UnclassifiedSatelliteTleSpecification;
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

            $tleInformation->raan = $tleModel->raan();
            $tleInformation->semiMajorAxis = $tleModel->semiMajorAxis();

            // Calculate all orbit type specifications
            $tleInformation->geostationaryOrbit = (new GeostationaryOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->geosynchronousOrbit = (new GeosynchronousOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->circularOrbit = (new CircularOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->ellipticalOrbit = (new EllipticalOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->lowEarthOrbit = (new LowEarthOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->mediumEarthOrbit = (new MediumEarthOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->highEarthOrbit = (new HighEarthOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->polarOrbit = (new PolarOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->sunSynchronousOrbit = (new SunSynchronousOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->molniyaOrbit = (new MolniyaOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->tundraOrbit = (new TundraOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->criticalInclinationOrbit = (new CriticalInclinationOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->posigradeOrbit = (new PosigradeOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->retrogradeOrbit = (new RetrogradeOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->decayingOrbit = (new DecayingOrbitTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->lowDrag = (new LowDragTleSpecification())->isSatisfiedBy($tleModel);

            // Calculate satellite classification specifications
            $tleInformation->classifiedSatellite = (new ClassifiedSatelliteTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->unclassifiedSatellite = (new UnclassifiedSatelliteTleSpecification())->isSatisfiedBy($tleModel);
            $tleInformation->recentTle = (new RecentTleTleSpecification())->isSatisfiedBy($tleModel);

            if (!$exists) {
                $this->entityManager->persist($tleInformation);
            }

            if (($i % self::BATCH_SIZE) === 0) {
                $this->entityManager->flush();
                $this->entityManager->clear();
            }
        }

        $this->entityManager->flush();

        $this->calculateStats();

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
