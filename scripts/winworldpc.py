import csv
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import sys
import os
import json
from datetime import datetime

#! prewarning: this only sort of works and at the moment has to be run manually every day, i don't really recommend using it but it _does_ work for now

# -----------------------------
# CONFIGURATION
# -----------------------------
CSV_FILE = "results.csv"
DOWNLOAD_DIR = r"T:\dl"
FINAL_DIR = r"G:\Shared drives\ISO Archives\tempuploaddir"
CONCURRENT_DOWNLOADS = 1
SPEED_LIMIT = "1m"
PER_DAY = 20
STATE_FILE = Path(os.getcwd()) / "download_state.json"

# -----------------------------
# FILTERING CONSTANTS
# -----------------------------
OS_KEYWORDS = [
    "os", "operating system", "windows", "dos", "unix", "linux",
    "bsd", "ms-dos", "cp/m", "cpm", "beos", "amigaos", "solaris",
    "irix", "hp-ux", "aix", "macos", "system", "tunix", "vms"
]

GTFO_KEYWORDS = [
    "for", "sdk", "adobe", "powerpoint", "money", "word", "excel", "sql", 
    "exchange", "visual", "intellipoint", "wise", "msn", "diagnostics", 
    "workgroup", "office", "bookshelf", "mouse", "assembler", "mappoint",
    "flight", "media player", "cinemania", "publisher", "arcade", "development kit",
    "musical instruments", "sound system", "aldus", "autodesk", "access", "codeview",
    "c compiler", "learn", "source profiler", "basic", "manual", "windows graph",
    "partitionmagic", "encarta", "decathlon"
]

# -----------------------------
# FILTERING FUNCTIONS
# -----------------------------
def is_os_entry(text: str) -> bool:
    might_be_os = any(k in text.lower() for k in OS_KEYWORDS)
    if not might_be_os:
        return False
    if any(k in text.lower() for k in GTFO_KEYWORDS):
        return False
    return True

# -----------------------------
# CSV PARSING
# -----------------------------
def extract_os_downloads(csv_file_path: str) -> dict[str, str]:
    os_downloads = {}
    with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if not row or len(row) < 9:
                continue
            name = row[0].strip()
            download_link = row[8].strip()
            if name and download_link and is_os_entry(name):
                os_downloads[name] = f"https://winworldpc.com{download_link}"
    return os_downloads

# -----------------------------
# STATE MANAGEMENT
# -----------------------------
def load_state():
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text())
            return data.get('date', ''), data.get('count', 0)
        except json.JSONDecodeError:
            pass
    return '', 0

def save_state(date_str: str, count: int):
    STATE_FILE.write_text(json.dumps({'date': date_str, 'count': count}))

# -----------------------------
# DOWNLOADING
# -----------------------------
def download_url(name: str, url: str, download_dir: str, speed_limit: str, final_dir: str) -> bool:
    """Download file; return True if downloaded, False if skipped."""
    final_path = Path(final_dir) / name

    if final_path.exists():
        print(f"Skipping (exists): {final_path}")
        return False  # skipped, don't count

    UA = 'Mozilla/5.0 (compatible; atlisoarchiver-winworldpc/1.0 +https://fastly.c48.uk/isoarchiverinfo.txt)'
    print(f"Downloading: {url} as {name}")
    try:
        subprocess.run([
            "wget",
            "--limit-rate", speed_limit,
            f"--user-agent={UA}",
            "-P", download_dir,
            "-4",
            "--content-disposition",
            url
        ], check=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed: {e.cmd} (exit {e.returncode})")
        return False

# -----------------------------
# MAIN
# -----------------------------
def main():
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    os.makedirs(FINAL_DIR, exist_ok=True)

    today_str = datetime.now().strftime('%Y-%m-%d')
    last_date, downloaded_today = load_state()
    if last_date != today_str:
        downloaded_today = 0

    remaining = PER_DAY - downloaded_today
    if remaining <= 0:
        print(f"Download limit reached for {today_str} ({PER_DAY} files). Try again tomorrow.")
        sys.exit()

    downloads = extract_os_downloads(CSV_FILE)
    pending = []
    for name, url in downloads.items():
        ext = Path(url).suffix or ".iso"
        safe = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).rstrip()
        if not (Path(FINAL_DIR) / f"{safe}{ext}").exists():
            pending.append((name, url))

    if not pending:
        print("No new files to download.")
        return

    to_download = pending[:remaining]
    print(f"Preparing to download up to {len(to_download)} files (quota remaining: {remaining})")

    with ThreadPoolExecutor(max_workers=CONCURRENT_DOWNLOADS) as executor:
        futures = {executor.submit(download_url, name, url, DOWNLOAD_DIR, SPEED_LIMIT, FINAL_DIR): (name, url)
                   for name, url in to_download}

        for future in as_completed(futures):
            name, url = futures[future]
            try:
                success = future.result()
                if success:
                    downloaded_today += 1
                    save_state(today_str, downloaded_today)
                else:
                    # skipped or failed; leave count unchanged
                    pass
            except Exception as e:
                print(f"Error downloading {name}: {e}")

    print(f"Done. {downloaded_today} files downloaded today.")

if __name__ == "__main__":
    main()
