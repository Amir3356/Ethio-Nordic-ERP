# Multi-stage build for Laravel backend

# ==================== BUILD STAGE ====================
FROM php:8.2-fpm as builder

WORKDIR /var/www/ethionordic

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    gd \
    json \
    && docker-php-ext-configure gd --with-freetype --with-jpeg

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader

# Generate app key
RUN php artisan key:generate

# ==================== RUNTIME STAGE ====================
FROM php:8.2-fpm

WORKDIR /var/www/ethionordic

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    gd \
    json \
    && docker-php-ext-configure gd --with-freetype --with-jpeg

# Configure PHP-FPM
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# Copy from builder stage
COPY --from=builder /var/www/ethionordic /var/www/ethionordic

# Create necessary directories
RUN mkdir -p \
    storage/logs \
    storage/framework/views \
    storage/framework/cache \
    bootstrap/cache \
    && chown -R www-data:www-data \
    storage \
    bootstrap/cache

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]
