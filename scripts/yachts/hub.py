"""Secure Hugging Face CLI publication. Read-only preflight is the default."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

from huggingface_hub import HfApi, hf_hub_download
from huggingface_hub.errors import RepositoryNotFoundError, HfHubHTTPError


def load_credential(path: Path) -> str:
    token = path.read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"hf_[A-Za-z0-9]+", token):
        raise ValueError("Credential file must contain only a Hugging Face token, not executable shell syntax.")
    return token


def preflight(token: str) -> dict:
    api = HfApi(endpoint="https://huggingface.co", token=token)
    account = api.whoami(cache=False)
    owner = account.get("name", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", owner) or account.get("type") != "user":
        raise ValueError("Could not resolve the authenticated personal namespace.")
    repository = f"{owner}/hullscope-yachts"
    existing = None
    try:
        info = api.dataset_info(repository, files_metadata=False)
        existing = {"id": info.id, "revision": info.sha, "private": info.private, "gated": info.gated}
    except RepositoryNotFoundError:
        pass
    auth = account.get("auth", {}).get("accessToken", {})
    # Only explicitly whitelisted account metadata is printed. Never dump whoami/auth.
    return {
        "owner": owner,
        "repository": repository,
        "tokenRole": auth.get("role", "unknown"),
        "existingRepository": existing,
        "storageAllowance": "unverified; check account capacity against staged release size before publication",
        "published": False,
    }


def inspect_release(stage: Path) -> dict:
    """Recheck exact staged bytes immediately before giving the CLI the folder."""
    root = Path(__file__).resolve().parents[2] / ".tools" / "yachts" / "stages"
    if not stage.is_dir() or stage.is_symlink() or root.resolve() not in stage.resolve().parents:
        raise ValueError("Publication requires an explicitly staged release directory.")
    release = json.loads((stage / "release.json").read_text(encoding="utf-8"))
    if release.get("project") != "hullscope-yachts" or release.get("status") != "validated" or release.get("unresolvedSeedRows") != 0 or not release.get("models"):
        raise ValueError("The collection has not passed the staging gate.")
    checksums = {}
    for line in (stage / "checksums.txt").read_text(encoding="utf-8").splitlines():
        match = re.fullmatch(r"([a-f0-9]{64})  ([A-Za-z0-9_./-]+)", line)
        if not match or any(part in {"", ".", ".."} for part in match[2].split("/")) or match[2] in checksums:
            raise ValueError("Malformed or duplicate release checksum entry.")
        checksums[match[2]] = match[1]
    files = [path for path in stage.rglob("*") if not path.is_dir()]
    actual = {path.relative_to(stage).as_posix() for path in files}
    if actual != set(checksums) | {"checksums.txt"}:
        raise ValueError("Unintended files were added to the inspected stage.")
    size = 0
    for path in files:
        if path.is_symlink() or stage.resolve() not in path.resolve().parents:
            raise ValueError("Symlinks are not permitted in a publication.")
        data = path.read_bytes()
        size += len(data)
        rel = path.relative_to(stage).as_posix()
        if rel != "checksums.txt" and hashlib.sha256(data).hexdigest() != checksums[rel]:
            raise ValueError("Staged content changed after validation.")
        if re.search(rb"hf_[A-Za-z0-9]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", data):
            raise ValueError("Potential credential in staged content.")
    return {"bytes": size, "files": len(files), "checksumsSha256": hashlib.sha256((stage / "checksums.txt").read_bytes()).hexdigest()}


def publish(token: str, stage: Path, storage_review: Path) -> dict:
    inspected = inspect_release(stage)
    identity = preflight(token)
    storage = json.loads(storage_review.read_text(encoding="utf-8"))
    if storage.get("repository") != identity["repository"] or storage.get("checksumsSha256") != inspected["checksumsSha256"] or storage.get("stagedBytes") != inspected["bytes"] or storage.get("approved") is not True or storage.get("paidUpgrade") is not False or not storage.get("evidence"):
        raise ValueError("A size-specific, evidenced, no-paid-upgrade storage assessment is required.")
    api = HfApi(endpoint="https://huggingface.co", token=token)
    repository = identity["repository"]
    existing = identity["existingRepository"]
    if existing:
        if existing["private"] or existing["gated"]:
            raise ValueError("Existing repository is not the expected public, ungated collection.")
        try:
            marker_path = hf_hub_download(repository, "release.json", repo_type="dataset", revision=existing["revision"], token=token)
            marker = json.loads(Path(marker_path).read_text(encoding="utf-8"))
        except Exception:
            raise ValueError("Refusing to overwrite an existing repository without a verified Hullscope release marker.") from None
        if marker.get("project") != "hullscope-yachts" or marker.get("status") != "validated":
            raise ValueError("Existing repository is unrelated; it will not be overwritten.")
    cli = Path(sys.executable).parent / "hf"
    if not cli.is_file():
        raise ValueError("Use the version-locked publishing environment.")
    environment = {**os.environ, "HF_TOKEN": token, "HF_ENDPOINT": "https://huggingface.co", "HF_HUB_DISABLE_TELEMETRY": "1", "HF_HUB_VERBOSITY": "error", "HF_HUB_DISABLE_PROGRESS_BARS": "1"}
    def run(arguments):
        completed = subprocess.run([str(cli), *arguments], env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=False)
        if completed.returncode:
            # Do not print CLI logs, headers, account responses, or environment values.
            raise ValueError("Hugging Face CLI failed; no application release has been promoted.")
    if not existing:
        run(["repos", "create", repository, "--repo-type", "dataset", "--public"])
    # A single metadata commit is used. Never delete paths, squash history, or upload the workspace.
    run(["upload", repository, str(stage.resolve()), ".", "--repo-type", "dataset", "--revision", "main", "--commit-message", f"Validated Hullscope yacht collection {inspected['checksumsSha256'][:12]}"])
    revision = api.dataset_info(repository, files_metadata=False).sha
    if not revision or not re.fullmatch(r"[a-f0-9]{40}", revision):
        raise ValueError("Could not identify the uploaded immutable revision.")
    # The anonymous API and integrity list must agree before an app promotion is even eligible.
    public = HfApi(endpoint="https://huggingface.co", token=False).dataset_info(repository, revision=revision)
    if public.private or public.gated:
        raise ValueError("Uploaded collection is not anonymously readable.")
    checksum_path = hf_hub_download(repository, "checksums.txt", repo_type="dataset", revision=revision, token=False)
    if hashlib.sha256(Path(checksum_path).read_bytes()).hexdigest() != inspected["checksumsSha256"]:
        raise ValueError("Anonymous revision does not match the staged collection.")
    return {"repository": repository, "revision": revision, **inspected, "published": True, "applicationPromoted": False, "browserVerification": "required before promotion"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--token-file", type=Path, default=Path("/Users/cristianexer/.HF_TOKEN"))
    parser.add_argument("--publish", type=Path, help="Explicit validated stage to upload. Omit for read-only account preflight.")
    parser.add_argument("--storage-review", type=Path, help="Local size-specific storage/redistribution assessment; not uploaded.")
    args = parser.parse_args()
    try:
        token = load_credential(args.token_file)
        os.environ["HF_TOKEN"] = token
        os.environ["HF_ENDPOINT"] = "https://huggingface.co"
        if args.publish and not args.storage_review:
            raise ValueError("Publication requires a reviewed storage assessment.")
        result = publish(token, args.publish.resolve(), args.storage_review) if args.publish else preflight(token)
        print(json.dumps(result, indent=2))
        return 0
    except HfHubHTTPError as error:
        print(json.dumps({"error": "Hugging Face preflight failed", "status": error.response.status_code}), file=sys.stderr)
    except (OSError, ValueError) as error:
        print(json.dumps({"error": "Credential or account preflight failed", "kind": type(error).__name__}), file=sys.stderr)
    finally:
        os.environ.pop("HF_TOKEN", None)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
