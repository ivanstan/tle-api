<?php

/** @noinspection ALL */

namespace Deployer;

require 'recipe/symfony.php';

set('repository', 'https://github.com/ivanstan/tle-api');
set('bin_dir', 'bin');
set('http_user', 'glutenfr');
set('writable_mode', 'chmod');
set('default_selector', 'stage=production');
set('bin/composer', '~/bin/composer.phar');
set('composer_options', '--verbose --prefer-dist --no-progress --no-interaction --optimize-autoloader');
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
    'public/static',
    'public/images',
]);
add('writable_dirs', ['var']);

host('tle.ivanstanojevic.me')
    ->setRemoteUser('glutenfr')
    ->setPort(2233)
    ->setLabels(['stage' => 'production'])
    ->set('deploy_path', '~/projects/tle.ivanstanojevic.me');

task('test', function () {
//    set('symfony_env', 'test');
//    runLocally('bin/phpunit');
//    set('symfony_env', 'dev');
});

task('deploy:dump-env', function () {
    run('cd {{release_path}} && {{bin/composer}} dump-env prod');
});

task('deploy:executable', function () {
    run('chmod +x {{release_path}}/bin/console');
});

// Hook custom tasks into the Symfony recipe's deploy workflow
before('deploy', 'test');
after('deploy:vendors', 'deploy:executable');
after('deploy:cache:clear', 'deploy:dump-env');
