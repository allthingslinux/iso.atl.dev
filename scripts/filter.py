SKIP_EXTENSIONS = (
    ".rpm", ".repo", ".deb", ".db", ".pkg.tar", ".pkg.tar.zst", ".pkg", ".xml.gz", ".xml",
    ".xml.zck", "xml.xz", ".sqlite.gz", ".sqlite.xz", ".cfg", ".conf", "gpl", ".pf2",
    "vmlinuz", ".txt", ".efi", ".manifest", ".sqlite.bz2", ".gpg", ".html", "gpg-key",
    ".css", ".js", ".php", "gpg-key-beta", "gpg-key-fedora", "gpg-key-fedora-rawhide",
    "gpg-key-fedora-test", "gpg-key-rawhide", ".png", ".dtb", "vmlinuz-lpae",
    "memtest", "license", "vmlinuz-pae", "gpg-key-fedora-x86_64", "compose_id", ".o", "tbl", ".torrent",
    ".json", ".mod", "readme", "lst", "c32", ".yaml.gz", "community-charter", "eula", ".qcow2", ".vhd", ".box",
    ".hdr", ".sh", ".msg", ".lss", "boot.cat", ".list", ".patch", "time", "filelist.gz", "dir_sizes", "empty_repo"
)
BANNED_KEYWORDS = [
    "/os/", "rpm", "source", "jigdo", "template", "_toolchain", "netinst", "xml", "fullfile", "metadata",
    "initrd.img", "kickstart", "azure", "ec2", "cloud", "/repo/", "/updates/", "/kmods/", "/headers/", "manifest",
    "pkglist", "srclist", "docs", "/base/", "scripts", "release-notes", "isolinux", "copying", "autorun", "autoboot",
    "/de/", "/es/", "/it/", "/fr/", "/i386/images/", "/build/livecd/"
]

FILTERED_OUTPUT_FILE = "filtered.txt"
INPUT_FILE = "unfiltered.txt"

def should_skip(url: str) -> bool:
    url_lc = url.lower()
    if url_lc.endswith(SKIP_EXTENSIONS):
        return True
    for keyword in BANNED_KEYWORDS:
        if keyword in url_lc:
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

urls = parse_queue(INPUT_FILE)

with open(FILTERED_OUTPUT_FILE, "w") as f:
    for url in urls:
        f.write(f"{url}\n")
