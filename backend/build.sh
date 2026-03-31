#!/bin/bash
set -e
echo "Python version: $(python --version)"
pip install -r requirements.txt
echo "Build complete. Model will be loaded from ./model"
