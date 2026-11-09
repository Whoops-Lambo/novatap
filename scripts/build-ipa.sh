#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'An iPhone IPA requires macOS with Xcode. Use the Build iPhone IPA GitHub Actions workflow.' >&2
  exit 1
fi
command -v xcodebuild >/dev/null
command -v pod >/dev/null || { echo "Install CocoaPods first: brew install cocoapods" >&2; exit 1; }
npm ci
npm run ios:sync
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath ios/App/build CODE_SIGNING_ALLOWED=NO build
# Always stage in a fresh directory so repeat builds cannot nest App.app.
mkdir -p artifacts
staging_dir=$(mktemp -d "${TMPDIR:-/tmp}/novatap-ipa.XXXXXX")
trap 'rm -rf "$staging_dir"' EXIT
mkdir "$staging_dir/Payload"
cp -R ios/App/build/Build/Products/Release-iphoneos/App.app "$staging_dir/Payload/"
ipa_path="$PWD/artifacts/NovaTap.ipa"
(cd "$staging_dir" && /usr/bin/ditto -c -k --keepParent Payload "$ipa_path")
python3 scripts/verify-ipa.py "$ipa_path"
echo 'Created artifacts/NovaTap.ipa. Sign and install it with Sideloadly.'
