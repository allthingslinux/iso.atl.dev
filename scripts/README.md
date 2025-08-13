# ISO Downloader Utilities

This folder contains utilities for downloading ISO files and uploading them to a shared drive.
Everything is fairly experimental, don't expect decent code quality.

## What each script does
- `downloader.py`: Designed to work on Windows with a Google Drive share and a temporary directory. Has a whole speed limit schedule system thingy to avoid overloading internet connections or causing SSDs to fill up.
- `dedi.py`: Designed to work on either Windows or Linux with a temporary directory. Utilises a gservice account in `service_account.json` and uses the google python APIs.
- `filter.py`: Takes a file `unfiltered.txt` and uses the constants `SKIP_EXTENSIONS` and `BANNED_KEYWORDS` to filter out files that are not suitable for archive.
- `rclonededi.py`: Same as `dedi.py` but uses rclone to upload files to a remote drive, allowing for speed limits to be set on uploads.
- `winworldpc.py`: Very experimental winworldpc downloader, takes a `results.csv` and tries to account for the winworldpc download limit. Designed to work on Windows, can be modified to work on Linux.

All downloading scripts support a bandwidth limiter.
