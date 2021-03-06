#!/bin/bash

set -eu

usage() {
  echo "Usage: ./$(basename $0) version"
  exit 1
}

hintVersion() {
  echo "Hint: latest released version is '$(git tag | tail -1)'."
}

checkVersion() {
  local version="$1"
  if [[ $(git tag | grep "${version}" | wc -l) -ne 0 ]]; then
    echo "Version '${version}' exists already. Use 'git tag' to see all current versions."
    hintVersion
    echo "Aborting..."
    exit 1
  fi
}

release() {
  local version="$1"
  echo "Releasing version '${version}'..."
  local target=releases/jasmine-fake-ajax-${version}.js
  cp lib/jasmine-fake-ajax.js ${target}
  git add ${target}
  git commit -m "Release version ${version}"
  git tag -a "${version}" # opens editor for message
  git push --tags
  git push origin master
  echo "Released version '${version}'."
}

# MAIN

if [[ $# -ne 1 ]]; then
  echo "Version number is missing."
  hintVersion
  usage
fi

version="$1"
checkVersion ${version}
release ${version}
toilet --gay "kthxbye"

