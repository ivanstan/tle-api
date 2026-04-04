<?php

namespace App\Entity;

use App\Repository\McpRequestRepository;
use Doctrine\ORM\Mapping as ORM;
use Ivanstan\SymfonySupport\Services\DateTimeService;

#[ORM\Entity(repositoryClass: McpRequestRepository::class)]
#[ORM\Table(name: 'mcp_requests')]
#[ORM\HasLifecycleCallbacks]
class McpRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: 'integer')]
    private int $id;

    #[ORM\Column(name: 'session_id', type: 'string', nullable: true)]
    private ?string $sessionId;

    #[ORM\Column(name: 'method', type: 'string')]
    private string $method;

    #[ORM\Column(name: 'tool_name', type: 'string', nullable: true)]
    private ?string $toolName;

    #[ORM\Column(name: 'input', type: 'json', nullable: true)]
    private ?array $input;

    #[ORM\Column(name: 'output', type: 'json', nullable: true)]
    private ?array $output;

    #[ORM\Column(name: 'ip', type: 'string', nullable: true)]
    private ?string $ip;

    #[ORM\Column(name: 'user_agent', type: 'string', nullable: true)]
    private ?string $userAgent;

    #[ORM\Column(name: 'is_error', type: 'boolean', options: ['default' => 0])]
    private bool $isError = false;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function update(): void
    {
        $this->createdAt = DateTimeService::getCurrentUTC();
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getSessionId(): ?string
    {
        return $this->sessionId;
    }

    public function setSessionId(?string $sessionId): void
    {
        $this->sessionId = $sessionId;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function setMethod(string $method): void
    {
        $this->method = $method;
    }

    public function getToolName(): ?string
    {
        return $this->toolName;
    }

    public function setToolName(?string $toolName): void
    {
        $this->toolName = $toolName;
    }

    public function getInput(): ?array
    {
        return $this->input;
    }

    public function setInput(?array $input): void
    {
        $this->input = $input;
    }

    public function getOutput(): ?array
    {
        return $this->output;
    }

    public function setOutput(?array $output): void
    {
        $this->output = $output;
    }

    public function getIp(): ?string
    {
        return $this->ip;
    }

    public function setIp(?string $ip): void
    {
        $this->ip = $ip;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): void
    {
        $this->userAgent = $userAgent;
    }

    public function isError(): bool
    {
        return $this->isError;
    }

    public function setIsError(bool $isError): void
    {
        $this->isError = $isError;
    }

    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }
}
