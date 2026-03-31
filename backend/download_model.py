from sentence_transformers import SentenceTransformer
import os

save_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
os.makedirs(save_path, exist_ok=True)
print(f"Downloading model to {save_path}...")
SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2").save(save_path)
print("Done.")
