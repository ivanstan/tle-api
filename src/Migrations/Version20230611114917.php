<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20230611114917 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tle_stats (name VARCHAR(255) NOT NULL, tle_id INT NOT NULL, INDEX IDX_574767AAE84B6F2B (tle_id), PRIMARY KEY(name, tle_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE tle_stats ADD CONSTRAINT FK_574767AAE84B6F2B FOREIGN KEY (tle_id) REFERENCES tle (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tle_stats DROP FOREIGN KEY FK_574767AAE84B6F2B');
        $this->addSql('DROP TABLE tle_stats');
    }
}
