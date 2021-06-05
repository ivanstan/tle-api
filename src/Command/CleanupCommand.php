<?php

namespace App\Command;

use App\Repository\RequestRepository;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class CleanupCommand extends Command
{
    /** @noinspection PhpOptionalBeforeRequiredParametersInspection */
    public function __construct(string $name = null, private RequestRepository $repository)
    {
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this
            ->setName('cleanup')
            ->setDescription('Performs periodic cleanup on unused data');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->repository->removeBefore(
            (new \DateTime())->sub(new \DateInterval('P2M'))
        );

        return Command::SUCCESS;
    }
}
