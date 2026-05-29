import zipfile
import os

zip_path = r"C:\Users\02790830\Downloads\files.zip"
extract_path = r"C:\Users\02790830\Documents\antigravity\cool-franklin\extracted_files"

os.makedirs(extract_path, exist_ok=True)

try:
    print(f"Extracting {zip_path} to {extract_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    print("Extraction completed successfully!")
except Exception as e:
    print(f"Error during extraction: {e}")
