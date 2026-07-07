FROM php:8.4-cli-alpine

RUN apk add --no-cache \
    postgresql-dev \
    unzip \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo_pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json ./
COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

EXPOSE 8000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=8000"]