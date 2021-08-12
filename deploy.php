<?php /** @noinspection ALL */

namespace Deployer;

require 'recipe/symfony.php';

set('repository', 'https://github.com/ivanstan/tle-api');
set('git_tty', true);
set('bin_dir', 'bin');
set('http_user', 'glutenfr');
set('writable_mode', 'chmod');
set('default_stage', 'production');
set('bin/composer', '~/bin/composer.phar');
set('composer_options', '{{composer_action}} --verbose --prefer-dist --no-progress --no-interaction --optimize-autoloader');
add('shared_files', [
    '.env',
    'public/robots.txt',
    'public/manifest.json',
    'public/asset-manifest.json',
    'public/favicon.ico',
    'public/index.html',
    'public/logo192.png',
    'public/logo512.png',
]);
add('shared_dirs', [
    'var',
    'public/static',
    'public/images',
]);
add('writable_dirs', ['var']);

host('ivanstanojevic.me')
    ->user('glutenfr')
    ->port(2233)
    ->stage('production')
    ->set('deploy_path', '~/projects/tle.ivanstanojevic.me');

task('test', function () {
    set('symfony_env', 'dev');
    runLocally('bin/phpunit');
});

task('deploy:dump-env', function () {
    run('cd {{release_path}} && {{bin/composer}} dump-env prod');
});

task('deploy:executable', function () {
    run('chmod +x {{release_path}}/bin/console');
});

task(
    'deploy',
    [
        'deploy:info',
        'deploy:prepare',
        'deploy:lock',
        'deploy:release',
        'deploy:update_code',
        'deploy:clear_paths',
        'deploy:create_cache_dir',
        'deploy:shared',
        'deploy:assets',
        'deploy:writable',
        'deploy:vendors',
        'deploy:executable',
        'deploy:cache:clear',
        'deploy:cache:warmup',
        'deploy:dump-env',
        'database:migrate',
        'deploy:symlink',
        'deploy:unlock',
        'cleanup',
    ]
);

before('deploy', 'test');
after('deploy:failed', 'deploy:unlock');
