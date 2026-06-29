@echo off
SET "JAVA_HOME=C:\Users\Amy Lorella\.gemini\antigravity\scratch\jdk21\jdk-21.0.11+10"
SET "ANDROID_HOME=C:\Users\Amy Lorella\AppData\Local\Android\Sdk"
SET "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
echo.
echo Iniciando compilacion del APK...
call gradlew.bat assembleDebug
