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
add('shared_files', [
    '.env',
    'public/robots.txt',
    'public/manifest.json',
    'public/asset-manifest.json',
    'public/favicon.ico',
    'public/index.html',
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

task('dump-autoload', function () {
   run('{{bin/composer}} dump-env prod');
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
//        'deploy:vendors',
//        'deploy:cache:clear',
//        'deploy:cache:warmup',
//        'dump-autoload',
        'deploy:writable',
//        'database:migrate',
        'deploy:symlink',
        'deploy:unlock',
        'cleanup',
    ]
);

//before('deploy', 'test');
after('deploy:failed', 'deploy:unlock');
