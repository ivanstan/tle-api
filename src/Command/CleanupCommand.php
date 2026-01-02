<?php

namespace App\Command;

use App\Repository\RequestRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'cleanup', description: 'Performs periodic cleanup on unused data'
)]
final class CleanupCommand extends Command
{
    public function __construct(private RequestRepository $repository)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $cutoffDate = (new \DateTime())->sub(new \DateInterval('P2M'));
        $deleted = $this->repository->removeBefore($cutoffDate);

        $output->writeln(sprintf(
            '[%s] Cleanup completed: removed %d request records older than %s',
            date('Y-m-d H:i:s'),
            $deleted,
            $cutoffDate->format('Y-m-d H:i:s')
        ));

        return Command::SUCCESS;
    }
}
