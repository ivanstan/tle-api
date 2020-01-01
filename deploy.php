<?php

namespace Deployer;

require 'recipe/symfony.php';

// Project repository
set('repository', 'https://github.com/ivanstan/tle-api');

// [Optional] Allocate tty for git clone. Default value is false.
set('git_tty', true); 

// Shared files/dirs between deploys 
add('shared_files', []);
add('shared_dirs', []);

// Writable dirs by web server 
add('writable_dirs', []);


// Hosts

host('data.ivanstanojevic.me')
    ->user('glutenfr')
    ->port(2233)
    ->stage('production')
    ->set('deploy_path', '~/projects/tle.ivanstanojevic.me');
    
// Tasks

task('build', function () {
    run('cd {{release_path}} && build');
});

// [Optional] if deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');

// Migrate database before symlink new release.

before('deploy:symlink', 'database:migrate');

