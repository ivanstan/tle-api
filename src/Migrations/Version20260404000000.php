<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260404000000 extends AbstractMigration
{
    public function isTransactional(): bool
    {
        return false;
    }

    public function getDescription(): string
    {
        return 'Create mcp_requests table for MCP server usage tracking';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE mcp_requests (
            id INT AUTO_INCREMENT NOT NULL,
            session_id VARCHAR(255) DEFAULT NULL,
            method VARCHAR(255) NOT NULL,
            tool_name VARCHAR(255) DEFAULT NULL,
            input JSON DEFAULT NULL,
            output JSON DEFAULT NULL,
            ip VARCHAR(255) DEFAULT NULL,
            user_agent VARCHAR(255) DEFAULT NULL,
            is_error TINYINT(1) DEFAULT 0 NOT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE mcp_requests');
    }
}
