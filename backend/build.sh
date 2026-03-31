#!/bin/bash
set -e
pip install -r requirements.txt
python -c "
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath('$0')))
from sentence_transformers import SentenceTransformer
save_path = os.path.join(os.path.abspath('.'), 'models', 'all-MiniLM-L6-v2')
os.makedirs(save_path, exist_ok=True)
SentenceTransformer('all-MiniLM-L6-v2').save(save_path)
print('Model saved to:', save_path)
"
