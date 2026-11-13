@echo off
chcp 65001 >nul
rem 双击打开知识网：优先 Edge，其次 Chrome，都没有就用系统默认浏览器
setlocal
set "PAGE=%~dp0index.html"
set "EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"

if exist "%EDGE%"  ( start "" "%EDGE%"  "%PAGE%" & goto :eof )
if exist "%EDGE2%" ( start "" "%EDGE2%" "%PAGE%" & goto :eof )
if exist "%CHROME%" ( start "" "%CHROME%" "%PAGE%" & goto :eof )
start "" "%PAGE%"
endlocal
