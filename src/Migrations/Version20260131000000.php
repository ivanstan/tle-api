<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Add boolean fields for TLE specifications to tle_information table
 */
final class Version20260131000000 extends AbstractMigration
{
    public function isTransactional(): bool
    {
        return false;
    }

    public function getDescription(): string
    {
        return 'Add boolean fields for all TLE specifications (orbit types, satellite classification, etc.)';
    }

    public function up(Schema $schema): void
    {
        // Rename existing geostationary field for consistency
        $this->addSql('ALTER TABLE tle_information CHANGE geostationary geo_stationary_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        
        // Add orbit type specification fields
        $this->addSql('ALTER TABLE tle_information ADD geo_synchronous_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD circular_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD elliptical_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD low_earth_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD medium_earth_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD high_earth_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD polar_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD sun_synchronous_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD molniya_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD tundra_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD critical_inclination_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD posigrade_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD retrograde_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD decaying_orbit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD low_drag TINYINT(1) DEFAULT 0 NOT NULL');
        
        // Add satellite classification fields
        $this->addSql('ALTER TABLE tle_information ADD classified_satellite TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD unclassified_satellite TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE tle_information ADD recent_tle TINYINT(1) DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // Rename geo_stationary_orbit back to geostationary
        $this->addSql('ALTER TABLE tle_information CHANGE geo_stationary_orbit geostationary TINYINT(1) DEFAULT 0 NOT NULL');
        
        // Remove all added fields
        $this->addSql('ALTER TABLE tle_information DROP geo_synchronous_orbit');
        $this->addSql('ALTER TABLE tle_information DROP circular_orbit');
        $this->addSql('ALTER TABLE tle_information DROP elliptical_orbit');
        $this->addSql('ALTER TABLE tle_information DROP low_earth_orbit');
        $this->addSql('ALTER TABLE tle_information DROP medium_earth_orbit');
        $this->addSql('ALTER TABLE tle_information DROP high_earth_orbit');
        $this->addSql('ALTER TABLE tle_information DROP polar_orbit');
        $this->addSql('ALTER TABLE tle_information DROP sun_synchronous_orbit');
        $this->addSql('ALTER TABLE tle_information DROP molniya_orbit');
        $this->addSql('ALTER TABLE tle_information DROP tundra_orbit');
        $this->addSql('ALTER TABLE tle_information DROP critical_inclination_orbit');
        $this->addSql('ALTER TABLE tle_information DROP posigrade_orbit');
        $this->addSql('ALTER TABLE tle_information DROP retrograde_orbit');
        $this->addSql('ALTER TABLE tle_information DROP decaying_orbit');
        $this->addSql('ALTER TABLE tle_information DROP low_drag');
        $this->addSql('ALTER TABLE tle_information DROP classified_satellite');
        $this->addSql('ALTER TABLE tle_information DROP unclassified_satellite');
        $this->addSql('ALTER TABLE tle_information DROP recent_tle');
    }
}

