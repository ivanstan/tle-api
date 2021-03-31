<?php

namespace App\Entity;

use App\Field\IdField;
use App\Service\DateTimeService;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity()
 * @ORM\HasLifecycleCallbacks()
 */
class Request
{
    use IdField;

    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(name="id", type="integer")
     */
    private int $id;

    /**
     * @ORM\ManyToOne(targetEntity="Tle")
     * @ORM\JoinColumn(name="tle_id", referencedColumnName="id", nullable=false)
     */
    private Tle $tle;

    /**
     * @ORM\Column(name="updated_at", type="datetime")
     */
    private \DateTime $createdAt;

    /**
     * @ORM\Column(name="ip", type="string")
     */
    private string $ip;

    /**
     * @ORM\PrePersist()
     * @ORM\PreUpdate()
     */
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
}
