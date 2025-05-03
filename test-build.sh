#!/bin/bash
# Script to test build with alternative config
cp next.config.js next.config.js.bak
cp next.config.test.js next.config.js
npm run build
cp next.config.js.bak next.config.js