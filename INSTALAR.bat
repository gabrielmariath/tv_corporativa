@echo off
title Instalador TV Corporativa ID Moveis
cd /d "%~dp0"
echo =======================================
echo  Instalador - TV Corporativa ID Moveis
echo =======================================
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org e rode este instalador novamente.
  pause
  exit /b
)
echo Node.js encontrado.
echo.
echo Liberando a porta 3000 no Firewall do Windows...
netsh advfirewall firewall add rule name="TV Corporativa ID Moveis Porta 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul
if %errorlevel% neq 0 (
  echo Nao foi possivel criar a regra de firewall. Rode este arquivo como Administrador se outros PCs nao conseguirem acessar.
) else (
  echo Firewall liberado com sucesso.
)
echo.
echo Instalacao concluida.
echo Para iniciar, use o arquivo INICIAR-TV.bat
echo.
pause
