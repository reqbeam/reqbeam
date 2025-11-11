.PHONY: help build up down logs restart clean cli db-init db-push db-studio

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose stop

logs: ## View logs from all services
	docker-compose logs -f

logs-web: ## View logs from web service
	docker-compose logs -f web

logs-cli: ## View logs from CLI service
	docker-compose logs -f cli

restart: ## Restart all services
	docker-compose restart

clean: ## Stop and remove containers, networks
	docker-compose down

clean-all: ## Stop and remove containers, networks, and volumes (⚠️ deletes data)
	docker-compose down -v

cli: ## Run CLI command (usage: make cli CMD="collection list")
	docker-compose run --rm cli $(CMD)

cli-interactive: ## Start interactive CLI session
	docker-compose run --rm -it cli sh

db-init: ## Initialize database (push schema and generate Prisma client)
	docker-compose exec web npx prisma generate
	docker-compose exec web npx prisma db push

db-push: ## Push Prisma schema to database
	docker-compose exec web npx prisma db push

db-studio: ## Open Prisma Studio (access at http://localhost:5555)
	docker-compose exec web npx prisma studio

shell-web: ## Open shell in web container
	docker-compose exec web sh

shell-cli: ## Open shell in CLI container
	docker-compose exec cli sh

status: ## Show status of all services
	docker-compose ps

rebuild: ## Rebuild and start services
	docker-compose up --build -d

