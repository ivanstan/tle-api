<?php

use App\Kernel;
use Ivanstan\SymfonySupport\Command\DoctrineReloadCommand;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\ConsoleOutput;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBag;
use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

// if (file_exists(dirname(__DIR__).'/config/bootstrap.php')) {
//    require dirname(__DIR__).'/config/bootstrap.php';
// } elseif (method_exists(Dotenv::class, 'bootEnv')) {
//    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
// }

// Load cached env vars if the .env.local.php file exists
// Run "composer dump-env prod" to create it (requires symfony/flex >=1.2)
if (is_array($env = @include dirname(__DIR__).'/.env.local.php')
    && ($_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? $env['APP_ENV']) === $env['APP_ENV']
) {
    foreach ($env as $k => $v) {
        $_ENV[$k] = $_ENV[$k] ?? (isset($_SERVER[$k]) && 0 !== strncmp($k, 'HTTP_', 5) ? $_SERVER[$k] : $v);
    }
} elseif (class_exists(Dotenv::class)) {
    // load all the .env files
    (new Dotenv())->loadEnv(dirname(__DIR__).'/.env');
} else {
    throw new RuntimeException('Please run "composer require symfony/dotenv" to load the ".env" files configuring the application.');
}

if ('test' === $_SERVER['APP_ENV']) {
    $kernel = new Kernel($_SERVER['APP_ENV'], true); // create a "test" kernel
    $kernel->boot();

    $command = new DoctrineReloadCommand(new ParameterBag(['kernel.environment' => $_SERVER['APP_ENV']]));
    (new Application($kernel))->add($command);

    $command->run(
        new ArrayInput(
            [
                'command' => 'doctrine:reload',
                '--no-interaction' => true,
            ]
        ),
        new ConsoleOutput()
    );
}

$_SERVER += $_ENV;
$_SERVER['APP_ENV'] = $_ENV['APP_ENV'] = ($_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? null) ?: 'dev';
$_SERVER['APP_DEBUG'] = $_SERVER['APP_DEBUG'] ?? $_ENV['APP_DEBUG'] ?? 'prod' !== $_SERVER['APP_ENV'];
$_SERVER['APP_DEBUG'] =
$_ENV['APP_DEBUG'] = (int) $_SERVER['APP_DEBUG'] || filter_var($_SERVER['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
