FROM php:8.4-fpm

WORKDIR /var/www


RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    zip


COPY --from=composer:2 /usr/bin/composer /usr/bin/composer


COPY . .


RUN composer install


RUN chmod -R 775 storage bootstrap/cache


EXPOSE 9000


CMD ["php-fpm"]