@echo off
SET "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
SET "ANDROID_HOME=C:\Users\Amy Lorella\AppData\Local\Android\Sdk"
SET "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
echo.
echo Iniciando compilacion del APK...
call gradlew.bat assembleDebug
