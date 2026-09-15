"""Verify a public dataset revision, reusing only content-verified cached files."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

from huggingface_hub import HfApi, hf_hub_download
from hub import inspect_release


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--reuse", type=Path)
    args = parser.parse_args()
    if not re.fullmatch(r"[a-f0-9]{40}", args.revision):
        raise ValueError("A full immutable revision is required.")
    inspected = inspect_release(args.stage, allow_draft=True)
    info = HfApi(token=False).dataset_info(args.repository, revision=args.revision, files_metadata=True)
    if info.private or info.gated or info.sha != args.revision:
        raise ValueError("Revision is not public and ungated.")
    remote = {item.rfilename: item for item in info.siblings}
    files = [path for path in args.stage.rglob("*") if path.is_file()]
    if set(remote) != {path.relative_to(args.stage).as_posix() for path in files} | {".gitattributes"}:
        raise ValueError("Remote file inventory differs from the stage.")
    destination = Path(".tools/yachts/verified") / args.revision
    reused = downloaded = 0
    for path in files:
        relative = path.relative_to(args.stage).as_posix()
        data = path.read_bytes()
        sha = hashlib.sha256(data).hexdigest()
        item = remote[relative]
        if item.size != len(data):
            raise ValueError(f"Remote size differs: {relative}")
        expected = item.lfs.sha256 if item.lfs else item.blob_id
        actual = sha if item.lfs else hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
        if expected != actual:
            raise ValueError(f"Remote content identity differs: {relative}")
        source = args.reuse / relative if args.reuse else None
        if source and source.is_file() and hashlib.sha256(source.read_bytes()).hexdigest() == sha:
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            reused += 1
        else:
            target = Path(hf_hub_download(args.repository, relative, repo_type="dataset", revision=args.revision, token=False, local_dir=destination))
            downloaded += 1
        if hashlib.sha256(target.read_bytes()).hexdigest() != sha:
            raise ValueError(f"Anonymous snapshot integrity failed: {relative}")
    print(json.dumps({"repository": args.repository, "revision": args.revision, "snapshot": str(destination), **inspected, "reused": reused, "downloaded": downloaded, "anonymous": True}, indent=2))


if __name__ == "__main__":
    main()
