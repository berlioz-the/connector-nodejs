#!/bin/bash

MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

cd $MY_DIR/gcp
npm publish

cd $MY_DIR/aws
npm publish

cd $MY_DIR/sdk
npm publish
