#!/bin/bash

set -e

./deploy-localnet.sh
cd interface
npm i
npm run build
npm run test
npm run lint
