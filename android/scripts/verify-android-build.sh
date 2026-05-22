#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "FitMeal AI Android build verification"
echo "--------------------------------------"

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: Java is missing. Install JDK 17 and set JAVA_HOME before running Android builds."
  exit 1
fi

JAVA_VERSION_OUTPUT=$(java -version 2>&1 | head -n 1)
echo "Java: ${JAVA_VERSION_OUTPUT}"

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  echo "ERROR: Android SDK is missing. Set ANDROID_HOME or ANDROID_SDK_ROOT."
  exit 1
fi

if [ ! -x "./gradlew" ]; then
  echo "ERROR: ./gradlew is not executable. Run: chmod +x ./gradlew"
  exit 1
fi

./gradlew --version
./gradlew :app:assembleDebug

echo "Android debug build completed successfully."