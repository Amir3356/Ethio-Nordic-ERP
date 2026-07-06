@echo off
REM Stop Nginx
C:\nginx-1.30.3\nginx.exe -s stop -p "C:\nginx-1.30.3"
echo Nginx stopped
