#!/usr/bin/env bash
# Root-level Gradle wrapper proxy that forwards commands (e.g. ./gradlew :app:bundleRelease)
# to the Android project located in ./android/
set -e
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$ROOT_DIR/android"
exec ./gradlew "$@"
