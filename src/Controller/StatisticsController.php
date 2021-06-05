<?php

namespace App\Controller;

use App\Entity\Request;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route("/api/tle")]
class StatisticsController extends AbstractApiController
{
    protected const INTERVAL = 6;

    #[Route("/hits", name: "tle_hits")]
    public function hits(
        EntityManagerInterface $em
    ): Response {
        $newerThan = new \DateTime('now');
        $newerThan->setTime(0, 0, 0);
        $newerThan->modify('-3 days');

        $qb = $em->createQueryBuilder();

        $qb->select(
            [
                'DATE_FORMAT(r.createdAt, \'%Y-%m-%d\') as date',
                'ROUND(CAST(DATE_FORMAT(r.createdAt, \'%H\') AS UNSIGNED) / :interval) as hour',
                'COUNT(r.id) as hits',
            ]
        );

        $qb
            ->from(Request::class, 'r')
            ->where('r.createdAt > :newerThan')
            ->setParameter('newerThan', $newerThan)
            ->groupBy('date, hour')
            ->setParameter('interval', self::INTERVAL);

        $result = $qb->getQuery()->getResult();

        $response = [];
        foreach ($result as $key => &$item) {
            if ($item['hour'] === "0") {
                $previousKey = $key - 1;
                if (isset($result[$previousKey])) {
                    $result[$previousKey]['hits'] = $item['hits'];
                }

                unset($result[$key]);
            }

            $date = new \DateTime($item['date']);
            $date->setTime((int)$item['hour'] * self::INTERVAL, 0);

            $response[$date->format(self::DATETIME_FORMAT)] = $item['hits'];
        }

        return new JsonResponse(
            $response,
            Response::HTTP_OK,
        );
    }
}
