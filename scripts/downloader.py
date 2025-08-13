import subprocess
from pathlib import Path
import shutil
from datetime import datetime
from time import sleep

# Configuration
QUEUE_FILE = "queue.txt"
FILTERED_OUTPUT_FILE = "filtered.txt"
DOWNLOAD_DIR = r"T:\dl"
FINAL_DIR = r"G:\Shared drives\ISO Archives\tempuploaddir"
BANDWIDTH_SCHEDULE = {
    "00:00": "3M",
    "00:30": "3M",
    "01:00": "3M",
    "01:30": "4M",
    "02:00": "4M",
    "02:30": "4M",
    "03:00": "5M",
    "03:30": "5M",
    "04:00": "6M",
    "04:30": "6M",
    "05:00": "6M",
    "05:30": "7M",
    "06:00": "7M",
    "06:30": "7M",
    "07:00": "6M",
    "07:30": "5M",
    "08:00": "3M",
    "08:30": "3M",
    "09:00": "3M",
    "09:30": "3M",
    "10:00": "3M",
    "10:30": "3M",
    "11:00": "3M",
    "11:30": "3M",
    "12:00": "3M",
    "12:30": "3M",
    "13:00": "3M",
    "13:30": "3M",
    "14:00": "3M",
    "14:30": "3M",
    "15:00": "3M",
    "15:30": "3M",
    "16:00": "3M",
    "16:30": "3M",
    "17:00": "3M",
    "17:30": "1M",
    "18:00": "1M",
    "18:30": "1M",
    "19:00": "1M",
    "19:30": "1M",
    "20:00": "1M",
    "20:30": "1M",
    "21:00": "1M",
    "21:30": "1M",
    "22:00": "1M",
    "22:30": "1M",
    "23:00": "1M",
    "23:30": "3M",
}

def parse_queue(file_path: str) -> list[str]:
    urls = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            url = line.split("#")[0].strip()
            if url:
                urls.append(url)
    return urls

def get_current_speed_limit() -> str:
    """Return the appropriate bandwidth limit based on current time."""
    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute

    # Convert schedule times to minutes for comparison
    times_in_minutes = sorted(
        ((int(t.split(":")[0]) * 60 + int(t.split(":")[1]), rate) for t, rate in BANDWIDTH_SCHEDULE.items())
    )

    selected_rate = times_in_minutes[0][1]  # default to the first entry
    for t_minutes, rate in times_in_minutes:
        if current_minutes >= t_minutes:
            selected_rate = rate
        else:
            break
    return selected_rate

def download_url(url: str, download_dir: str, final_dir: str) -> None:
    filename = url.split("/")[-1]
    final_path = Path(final_dir) / filename

    if final_path.exists():
        print(f"Skipping download; file already exists: {final_path}")
        return

    speed_limit = get_current_speed_limit()
    print(f"Downloading: {url} (Speed limit: {speed_limit})")

    try:
        subprocess.run([
            "wget", "--limit-rate", speed_limit, "-P", download_dir, url
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to download: {e.cmd} - Exit code {e.returncode}")
        return

    temp_path = Path(download_dir) / filename

    sleep(1)

    if temp_path.exists():
        print(f"Moving {temp_path} to {final_path}")
        shutil.move(str(temp_path), str(final_path))
    else:
        print(f"Downloaded file not found: {temp_path}")

def main():
    Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(FINAL_DIR).mkdir(parents=True, exist_ok=True)

    urls = parse_queue(QUEUE_FILE)
    total_files = len(urls)

    print(f"Total files to download: {total_files}")

    completed = 0

    for url in urls:
        download_url(url, DOWNLOAD_DIR, FINAL_DIR)
        completed += 1
        percent = (completed / total_files) * 100
        print(f"Progress: {completed}/{total_files} files downloaded ({percent:.1f}%)")

if __name__ == "__main__":
    main()
