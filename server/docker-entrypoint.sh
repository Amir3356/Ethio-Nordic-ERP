#!/bin/sh
set -e

if [ ! -f /var/www/vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    cd /var/www && composer install --no-interaction --no-progress
fi

exec php-fpm
