#!/bin/bash

NAME_SPACE="smart-spaces@libetal.com"
DIR=$(pwd)

cd ~ || exit

if [ ! -d .local ]; then
  mkdir .local
fi

cd .local || exit

if [ ! -d share ]; then
  mkdir share
fi

cd share || exit

if [ ! -d gnome-shell ]; then
  mkdir gnome-shell
fi

cd gnome-shell || exit

if [ ! -d extensions ]; then
  mkdir extensions
fi

cd extensions || exit

if [ -d "${NAME_SPACE}" ]; then
  rm -R "${NAME_SPACE}"
fi

mkdir "${NAME_SPACE}" && cd "${NAME_SPACE}" || exit

cp "${DIR}/extension.js" ./extension.js
cp "${DIR}/metadata.json" ./metadata.json
cp "${DIR}/prefs.js" ./prefs.js

NEW_DIR=$(pwd)
echo "Installed in: ${NEW_DIR}"
ls
