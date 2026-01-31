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
        // Initialize statistics
        $stats = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'errors' => 0,
            'meanMotionProblems' => 0,
        ];

        // Initialize all specifications once (reuse them for all TLEs)
        $specifications = [
            'geostationaryOrbit' => new GeostationaryOrbitTleSpecification(),
            'geosynchronousOrbit' => new GeosynchronousOrbitTleSpecification(),
            'circularOrbit' => new CircularOrbitTleSpecification(),
            'ellipticalOrbit' => new EllipticalOrbitTleSpecification(),
            'lowEarthOrbit' => new LowEarthOrbitTleSpecification(),
            'mediumEarthOrbit' => new MediumEarthOrbitTleSpecification(),
            'highEarthOrbit' => new HighEarthOrbitTleSpecification(),
            'polarOrbit' => new PolarOrbitTleSpecification(),
            'sunSynchronousOrbit' => new SunSynchronousOrbitTleSpecification(),
            'molniyaOrbit' => new MolniyaOrbitTleSpecification(),
            'tundraOrbit' => new TundraOrbitTleSpecification(),
            'criticalInclinationOrbit' => new CriticalInclinationOrbitTleSpecification(),
            'posigradeOrbit' => new PosigradeOrbitTleSpecification(),
            'retrogradeOrbit' => new RetrogradeOrbitTleSpecification(),
            'decayingOrbit' => new DecayingOrbitTleSpecification(),
            'lowDrag' => new LowDragTleSpecification(),
            'classifiedSatellite' => new ClassifiedSatelliteTleSpecification(),
            'unclassifiedSatellite' => new UnclassifiedSatelliteTleSpecification(),
            'recentTle' => new RecentTleTleSpecification(),
        ];

        $builder = $this->entityManager
            ->createQueryBuilder()
            ->select('tle')
            ->from(Tle::class, 'tle');

        $tle = $input->getOption(self::OPTION_TLE);

        if (null !== $tle) {
            $builder->andWhere('tle.id = :tle');
            $builder->setParameter('tle', $tle);
        }

        /** @var Tle $tle */
        foreach ($builder->getQuery()->toIterable() as $i => $tle) {
            $stats['total']++;

            try {
                $exists = true;
                $tleInformation = $this->infoRepository->find($tle->getId());

                if (null === $tleInformation) {
                    $exists = false;
                    $tleInformation = new TleInformation($tle);
                    $stats['created']++;
                } else {
                    $stats['updated']++;
                }

                $tleModel = new \Ivanstan\Tle\Model\Tle($tle->getLine1(), $tle->getLine2(), $tle->getName());

                $tleInformation->inclination = $tleModel->getInclination();
                $tleInformation->eccentricity = $tleModel->eccentricity();
                $tleInformation->raan = $tleModel->raan();
                $tleInformation->semiMajorAxis = $tleModel->semiMajorAxis();

                // Calculate period once
                if ($tleModel->meanMotion() > 0) {
                    $tleInformation->period = $tleModel->period();
                } else {
                    $tleInformation->period = null;
                    $stats['meanMotionProblems']++;
                    $output->writeln(sprintf('<comment>Warning: Satellite %d (ID: %d) has mean motion problem</comment>', $tleModel->getId(), $tle->getId()));
                }

                // Calculate all specifications using pre-instantiated objects
                foreach ($specifications as $property => $specification) {
                    $tleInformation->$property = $specification->isSatisfiedBy($tleModel);
                }

                if (!$exists) {
                    $this->entityManager->persist($tleInformation);
                }

                // Flush periodically to avoid memory issues
                if (($i % self::BATCH_SIZE) === 0) {
                    $this->entityManager->flush();
                    $this->entityManager->clear();
                }
            } catch (\Throwable $e) {
                $stats['errors']++;
                $output->writeln(sprintf(
                    '<error>Error processing TLE %d: %s</error>',
                    $tle->getId(),
                    $e->getMessage()
                ));
                
                // Continue processing next TLE
                continue;
            }
        }

        // Final flush for remaining entities
        try {
            $this->entityManager->flush();
        } catch (\Throwable $e) {
            $output->writeln(sprintf('<error>Error flushing final batch: %s</error>', $e->getMessage()));
        }

        // Calculate global statistics
        try {
            $this->calculateStats();
        } catch (\Throwable $e) {
            $output->writeln(sprintf('<error>Error calculating stats: %s</error>', $e->getMessage()));
        }

        // Print summary statistics
        $output->writeln('');
        $output->writeln('<info>Processing Summary:</info>');
        $output->writeln(sprintf('  Total processed:       <fg=cyan>%d</>', $stats['total']));
        $output->writeln(sprintf('  New records created:   <fg=green>%d</>', $stats['created']));
        $output->writeln(sprintf('  Existing records updated: <fg=yellow>%d</>', $stats['updated']));
        
        if ($stats['meanMotionProblems'] > 0) {
            $output->writeln(sprintf('  Mean motion problems:  <comment>%d</comment>', $stats['meanMotionProblems']));
        }
        
        if ($stats['errors'] > 0) {
            $output->writeln(sprintf('  Errors encountered:    <error>%d</error>', $stats['errors']));
            return Command::FAILURE;
        }

        $output->writeln('');
        $output->writeln('<info>✓ Calculation completed successfully!</info>');

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
