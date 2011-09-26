#!/bin/bash

set -eu

coffee -c spec/run-jasmine.coffee
phantomjs spec/run-jasmine.js

