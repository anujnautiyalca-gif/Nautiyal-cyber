@rem ==============================================================================
@rem Gradle Startup Script for Windows - Nautiyal Cyber Cafe Android App
@rem Usage:
@rem   gradlew.bat :app:bundleRelease
@rem   gradlew.bat :app:assembleRelease
@rem ==============================================================================
@if "%DEBUG%" == "" @echo off
@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_HOME=%DIRNAME%
set WRAPPER_JAR=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

if defined JAVA_HOME goto findJavaFromJavaHome
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto checkWrapper

echo ================================================================================
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo Please install JDK 17+ or open the 'android' folder in Android Studio.
echo ================================================================================
exit /b 1

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe
if exist "%JAVA_EXE%" goto checkWrapper

echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
exit /b 1

:checkWrapper
if not exist "%WRAPPER_JAR%" (
    echo Downloading gradle-wrapper.jar...
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/gradle/gradle/v8.9.0/gradle/wrapper/gradle-wrapper.jar' -OutFile '%WRAPPER_JAR%'"
)

"%JAVA_EXE%" -Xmx2048m -Dfile.encoding=UTF-8 "-Dorg.gradle.appname=gradlew" -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*
if "%OS%"=="Windows_NT" endlocal
