<?php

namespace App\ViewModel\Model;

use Doctrine\ORM\NonUniqueResultException;
use Doctrine\ORM\NoResultException;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;
use Doctrine\ORM\Mapping\ClassMetadata;

class QueryBuilderPaginator
{
    protected const HYDRA_CONTEXT = 'https://www.w3.org/ns/hydra/context.jsonld';

    protected int|null $total = null;
    protected int $page = 1;
    protected int $pageSize = 20;

    private ClassMetadata $meta;

    public function __construct(protected QueryBuilder $builder)
    {
        $entity = $builder->getRootEntities()[0] ?? null;

        $this->meta = $builder->getEntityManager()->getClassMetadata($entity);
    }

    public function getCollection(Request $request, RouterInterface $router): array
    {
        return [
            '@context' => self::HYDRA_CONTEXT,
            '@id' => $router->generate($request->attributes->get('_route'), [], UrlGeneratorInterface::ABSOLUTE_URL),
            '@type' => 'Collection',
            'totalItems' => $this->getTotal(),
            'member' => $this->getCurrentPageResult(),
            'parameters' => array_merge($request->request->all(), $request->query->all()),
            'view' => $this->getView($request, $router),
        ];
    }

    public function getCurrentPageResult(): array
    {
        $builder = clone $this->builder;

        $builder->setMaxResults($this->pageSize);
        $builder->setFirstResult($this->getPageOffset($this->page, $this->pageSize));

        return $builder->getQuery()->getResult();
    }

    public function getTotal(): int
    {
        if ($this->total !== null) {
            return $this->total;
        }

        $builder = clone $this->builder;

        $alias = $builder->getRootAliases()[0] ?? null;
        $identifier = $this->meta->identifier[0] ?? null;

        $builder->select("COUNT($alias.$identifier)");

        try {
            $result = $builder->getQuery()->getSingleScalarResult();
        } catch (NonUniqueResultException) {
            $result = array_sum(
                array_map(static fn($item) => (int)$item, $builder->getQuery()->getScalarResult())
            );
        } catch (NoResultException) {
            $result = 0;
        }

        $this->total = $result;

        return $result;
    }

    public function getPageOffset(int $page, int $pageSize): int
    {
        $offset = 0;
        if ($page > 1) {
            $offset = ($page - 1) * $pageSize;
        }

        return $offset;
    }

    public function getView(Request $request, RouterInterface $router): array
    {
        $params = $request->query->all();

        $page = $this->page;
        $pages = max(1, ceil($this->getTotal() / $this->pageSize));

        $nextPage = $page;
        if ($page < $pages) {
            $nextPage = $page + 1;
        }

        $previousPage = $page;
        if ($page > 1) {
            $previousPage = $page - 1;
        }

        $result = [
            '@id' => $router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $page]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            '@type' => 'PartialCollectionView',
            'first' => $router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => 1]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            'previous' => $router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $previousPage]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            'next' => $router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $nextPage]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            'last' => $router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $pages]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
        ];

        if ($page === 1) {
            unset($result['previous']);
        }

        if ($page === $nextPage) {
            unset($result['next']);
        }

        return $result;
    }

    public function setCurrentPage(int $page): QueryBuilderPaginator
    {
        $this->page = $page;

        return $this;
    }

    public function setPageSize(int $pageSize): QueryBuilderPaginator
    {
        $this->pageSize = $pageSize;

        return $this;
    }
}
