import subprocess
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Configuration
QUEUE_FILE = "queue.txt"
DOWNLOAD_DIR = r"T:\dl2" # DOWNLOAD_DIR = "/tmp/isodl"
SPEED_LIMIT = "1m"

# Google Drive config
SERVICE_ACCOUNT_FILE = "service_account.json"
DRIVE_FOLDER_ID = "11epaa3D4nKP1fI2RHRVP42jx_JwrRsZ6"
SHARED_DRIVE_ID = "0AJ0TLbTX04lFUk9PVA"

def get_drive_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=['https://www.googleapis.com/auth/drive']
    )
    return build('drive', 'v3', credentials=creds)

def list_drive_files(service, folder_id: str, shared_drive_id: str) -> set[str]:
    """Returns a set of file names already in the shared drive folder."""
    files = set()
    page_token = None

    while True:
        response = service.files().list(
            q=f"'{folder_id}' in parents and trashed = false",
            corpora='drive',
            driveId=shared_drive_id,
            includeItemsFromAllDrives=True,
            supportsAllDrives=True,
            spaces='drive',
            fields='nextPageToken, files(name)',
            pageToken=page_token
        ).execute()

        for file in response.get('files', []):
            files.add(file['name'])

        page_token = response.get('nextPageToken')
        if not page_token:
            break

    return files

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

def download_url(url: str, download_dir: str, speed_limit: str, drive_service, drive_filenames: set[str]) -> None:
    filename = url.split("/")[-1]
    temp_path = Path(download_dir) / filename

    if filename in drive_filenames:
        print(f"Skipping {filename}; already exists on Google Drive.")
        return

    if temp_path.exists():
        print(f"Skipping download; file already exists locally: {temp_path}")
    else:
        print(f"Downloading: {url}")
        try:
            subprocess.run([
                "wget", "--limit-rate", speed_limit, "-P", download_dir, url
            ], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed to download: {e.cmd} - Exit code {e.returncode}")
            return

    if temp_path.exists():
        try:
            upload_to_drive(drive_service, str(temp_path), DRIVE_FOLDER_ID)
            temp_path.unlink()
            print(f"Deleted local file after upload: {temp_path}")
        except Exception as e:
            print(f"Upload failed for {temp_path}: {e}")
    else:
        print(f"Downloaded file not found: {temp_path}")

def upload_to_drive(service, file_path: str, folder_id: str):
    file_metadata = {
        'name': Path(file_path).name,
        'parents': [folder_id]
    }
    media = MediaFileUpload(file_path, resumable=True)
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id',
        supportsAllDrives=True
    ).execute()
    print(f"Uploaded to Drive: {file_path} (ID: {file.get('id')})")


def main():
    Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

    urls = parse_queue(QUEUE_FILE)
    total_files = len(urls)
    print(f"Total files to process: {total_files}")

    drive_service = get_drive_service()

    drive_filenames = list_drive_files(drive_service, DRIVE_FOLDER_ID, SHARED_DRIVE_ID)
    print(f"Found {len(drive_filenames)} existing files in the shared folder.")

    completed = 0
    for url in urls:
        download_url(url, DOWNLOAD_DIR, SPEED_LIMIT, drive_service, drive_filenames)
        completed += 1
        percent = (completed / total_files) * 100
        print(f"Progress: {completed}/{total_files} files processed ({percent:.1f}%)")

if __name__ == "__main__":
    main()
