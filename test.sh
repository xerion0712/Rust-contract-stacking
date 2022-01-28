#!/bin/bash

set -e

./deploy-localnet.sh
cd interface
npm i
npm run test -- --runInBand
