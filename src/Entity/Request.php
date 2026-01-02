<?php

namespace App\Entity;

use App\Repository\RequestRepository;
use Doctrine\ORM\Mapping as ORM;
use Ivanstan\SymfonySupport\Services\DateTimeService;

#[ORM\Entity(repositoryClass: RequestRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Request
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: 'integer')]
    private int $id;

    public function getId(): int
    {
        return $this->id;
    }

    #[ORM\ManyToOne(targetEntity: Tle::class)]
    #[ORM\JoinColumn(name: 'tle_id', referencedColumnName: 'id', nullable: false)]
    private Tle $tle;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    #[ORM\Column(name: 'ip', type: 'string')]
    private string $ip;

    #[ORM\Column(name: 'referer', type: 'string', nullable: true)]
    private ?string $referer;

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function update(): void
    {
        $this->createdAt = DateTimeService::getCurrentUTC();
    }

    public function getTle(): Tle
    {
        return $this->tle;
    }

    public function setTle(Tle $tle): void
    {
        $this->tle = $tle;
    }

    public function getIp(): string
    {
        return $this->ip;
    }

    public function setIp(string $ip): void
    {
        $this->ip = $ip;
    }

    public function getReferer(): ?string
    {
        return $this->referer;
    }

    public function setReferer(?string $referer): void
    {
        $this->referer = $referer;
    }
}
