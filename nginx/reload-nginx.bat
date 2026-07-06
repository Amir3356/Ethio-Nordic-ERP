@echo off
REM Reload Nginx configuration
C:\nginx-1.30.3\nginx.exe -s reload -p "C:\nginx-1.30.3"
echo Nginx configuration reloaded
