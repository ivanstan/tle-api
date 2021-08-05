<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestion;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'doctrine:reload', description: 'Purge database, execute migrations and load fixtures'
)]
final class DoctrineReloadCommand extends Command
{
    private static array $choices = [
        'y' => 'Yes',
        'n' => 'No',
    ];

    private static array $envs = [
        'dev',
        'test',
    ];

    public function __construct(private $env)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'force',
                'f',
                InputOption::VALUE_OPTIONAL,
                'Force execution even in production environment',
                false
            );
    }

    /**
     * @throws \Exception
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $helper = $this->getHelper('question');
        $question = new ChoiceQuestion('All data will be lost. Do you wish to continue?', self::$choices, false);
        $force = $input->getOption('force') !== false;

        if (!$force && !\in_array($this->env, self::$envs, true)) {
            $io->warning(
                'This is intended for use only in dev or test environment. Run with -f parameter to execute regardless of environment.'
            );

            return Command::FAILURE;
        }

        $application = $this->getApplication();

        if ($application === null) {
            throw new \RuntimeException('Application instance not found.');
        }

        if ($input->getOption('no-interaction') || $helper->ask($input, $output, $question) === 'y') {
            $application->setAutoExit(false);

            $io->writeln('Drop database');
            $options = ['command' => 'doctrine:database:drop', '--force' => true];
            $application->run(new ArrayInput($options));

            $io->writeln('Create database');
            $options = ['command' => 'doctrine:database:create', '--if-not-exists' => true];
            $application->run(new ArrayInput($options));

            $io->writeln('Execute migrations');
            $options = ['command' => 'doctrine:migration:migrate', '--no-interaction' => true];
            $application->run(new ArrayInput($options));

            $io->writeln('Load fixtures');
            $options = ['command' => 'doctrine:fixtures:load', '--no-interaction' => true];
            $application->run(new ArrayInput($options));
        }

        return Command::SUCCESS;
    }
}
