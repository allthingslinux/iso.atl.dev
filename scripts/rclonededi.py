import subprocess
from pathlib import Path

# ===============================
# CONFIGURATION
# ===============================
QUEUE_FILE = "filtered.txt"
DOWNLOAD_DIR = "/tmp/isodl"
SPEED_LIMIT_DOWNLOAD = "5m"  # Limit for wget (downloads)
SPEED_LIMIT_UPLOAD = "5M"    # Limit for rclone (uploads)

# Rclone / Google Drive
SERVICE_ACCOUNT_FILE = "service_account.json"
DRIVE_FOLDER_ID = "1KHOuGc_13_AKzfVv4lGXIRoF1fnVGhfr"
SHARED_DRIVE_ID = "0AJ0TLbTX04lFUk9PVA"

# Skip settings
SKIP_EXTENSIONS = (
    ".rpm", ".repo", ".deb", ".db", ".pkg.tar", ".pkg.tar.zst", ".pkg",
    ".xml.gz", ".xml", ".xml.zck", "xml.xz", ".sqlite.gz", ".sqlite.xz",
    ".cfg", ".conf", "gpl", ".pf2", "vmlinuz", ".txt", ".efi", ".manifest",
    ".sqlite.bz2", ".gpg", ".html", "gpg-key", ".css", ".js", ".php",
    "gpg-key-beta", "gpg-key-fedora", "gpg-key-fedora-rawhide",
    "gpg-key-fedora-test", "gpg-key-rawhide", ".png", ".dtb", "vmlinuz-lpae",
    "memtest", "license", "vmlinuz-pae", "gpg-key-fedora-x86_64",
    "compose_id", ".o", "tbl", ".torrent", "readme", ".yaml", "pem", ".sh",
    "package-sources", "hardlink-temporary", "sha512sums", ".log"
)

BANNED_KEYWORDS = [
    "/releases/current/", "sqlite", "/clear/config", "source",
    "/clear/releasenotes", "Root.pem", "gce", "cloud", "aliyun", "azure",
    "aws", "pxe", "vmware", "digitalocean", "license", "single-latest",
    "/clear/latest", "/clear/latest.sig", "kvm", "hyperv", "hyper-v",
    "service-os", "time", "dir_sizes"
]

# ===============================
# HELPER FUNCTIONS
# ===============================
def should_skip(url: str) -> bool:
    url_lc = url.lower()
    for keyword in BANNED_KEYWORDS:
        if keyword in url_lc:
            return True
    if url_lc.endswith(SKIP_EXTENSIONS) and "gpg-key" not in url_lc:
        return True
    return False

def parse_queue(file_path: str) -> list[str]:
    urls = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            url = line.split("#")[0].strip()
            if url and not should_skip(url):
                urls.append(url)
    return urls

def list_drive_files() -> set[str]:
    """List files in the Google Drive folder via rclone."""
    try:
        result = subprocess.run([
            "rclone", "lsf",
            f":drive:{DRIVE_FOLDER_ID}",
            "--drive-shared-drive-id", SHARED_DRIVE_ID,
            "--drive-service-account-file", SERVICE_ACCOUNT_FILE
        ], text=True, capture_output=True, check=True)
        files = result.stdout.strip().split("\n")
        return set(f for f in files if f)  # Remove empty strings
    except subprocess.CalledProcessError as e:
        print(f"Failed to list Drive files: {e}")
        return set()

def download_url(url: str, download_dir: str, speed_limit: str) -> Path | None:
    filename = url.split("/")[-1]
    temp_path = Path(download_dir) / filename

    if temp_path.exists():
        print(f"Skipping download; file already exists locally: {temp_path}")
        return temp_path

    print(f"Downloading: {url}")
    try:
        subprocess.run([
            "wget", "--limit-rate", speed_limit, "-P", download_dir, url
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to download: {url} - Exit code {e.returncode}")
        return None

    return temp_path if temp_path.exists() else None

def upload_to_drive(file_path: Path):
    try:
        subprocess.run([
            "rclone", "copy", str(file_path),
            f":drive:{DRIVE_FOLDER_ID}",
            "--drive-shared-drive-id", SHARED_DRIVE_ID,
            "--drive-service-account-file", SERVICE_ACCOUNT_FILE,
            "--bwlimit", SPEED_LIMIT_UPLOAD,
            "--transfers", "1",
            "--checkers", "1"
        ], check=True)
        print(f"Uploaded to Drive: {file_path}")
    except subprocess.CalledProcessError as e:
        print(f"Upload failed for {file_path}: {e}")

# ===============================
# MAIN LOGIC
# ===============================
def main():
    Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

    urls = parse_queue(QUEUE_FILE)
    total_files = len(urls)
    print(f"Total files to process: {total_files}")

    drive_filenames = list_drive_files()
    print(f"Found {len(drive_filenames)} existing files in Drive folder.")

    completed = 0
    for url in urls:
        filename = url.split("/")[-1]

        if filename in drive_filenames:
            print(f"Skipping {filename}; already exists on Drive.")
        else:
            file_path = download_url(url, DOWNLOAD_DIR, SPEED_LIMIT_DOWNLOAD)
            if file_path:
                upload_to_drive(file_path)
                file_path.unlink(missing_ok=True)
                print(f"Deleted local file after upload: {file_path}")

        completed += 1
        percent = (completed / total_files) * 100
        print(f"Progress: {completed}/{total_files} files processed ({percent:.1f}%)")

if __name__ == "__main__":
    main()
