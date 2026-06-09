import os
import shutil
import argparse
from pathlib import Path

def gather_files(source_dir, dest_dir, extension):
    # Create destination directory if it doesn't exist
    dest_path = Path(dest_dir)
    dest_path.mkdir(parents=True, exist_ok=True)
    
    # Define common groups
    image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    
    # Determine what we are looking for
    target_exts = []
    if extension.lower() == 'img':
        target_exts = image_exts
    else:
        # Ensure extension starts with a dot
        target_exts = [extension if extension.startswith('.') else f'.{extension}']

    print(f"Searching for {target_exts} in {source_dir}...")
    
    count = 0
    # rglob('*') recursively crawls through all subfolders
    for file_path in Path(source_dir).rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in target_exts:
            # Avoid copying from the destination folder if it's inside the source
            if dest_path in file_path.parents:
                continue
                
            try:
                # To prevent overwriting files with the same name, we can prepend the parent folder name
                unique_name = f"{file_path.parent.name}_{file_path.name}"
                shutil.copy2(file_path, dest_path / unique_name)
                count += 1
            except Exception as e:
                print(f"Error copying {file_path.name}: {e}")

    print(f"Done! Gathered {count} files into '{dest_dir}'.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gather files by type from subdirectories.")
    parser.add_argument("type", help="File extension to gather (e.g., 'img', 'pdf', 'txt')")
    parser.add_argument("--src", default=".", help="Source directory to search (default: current)")
    parser.add_argument("--out", default="gathered_files", help="Output folder name")

    args = parser.parse_args()
    gather_files(args.src, args.out, args.type)