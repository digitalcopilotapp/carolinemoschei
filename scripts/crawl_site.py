#!/usr/bin/env python3
"""Simple crawler to enumerate internal pages on carolinemoschei.com."""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from collections import deque
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Set

BASE_URL = "https://carolinemoschei.com"
ALLOWED_HOSTS = {"carolinemoschei.com", "www.carolinemoschei.com"}
USER_AGENT = "Mozilla/5.0 (compatible; CM-AuditBot/1.0)"
MAX_PAGES = 300
REQUEST_DELAY = 0.5
OUTPUT_PATH = Path("docs/reference/site-map.json")


@dataclass
class PageInfo:
    status: int | str
    content_type: str
    links: List[str]
    error: str | None = None

    def to_dict(self) -> Dict[str, object]:
        data: Dict[str, object] = {
            "status": self.status,
            "content_type": self.content_type,
            "links": self.links,
        }
        if self.error:
            data["error"] = self.error
        return data


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: Set[str] = set()

    def handle_starttag(self, tag: str, attrs):
        if tag != "a":
            return
        href = None
        for name, value in attrs:
            if name == "href":
                href = value
                break
        if not href:
            return
        href = href.split("#")[0]
        if not href:
            return
        parsed = urllib.parse.urlparse(href)
        if parsed.scheme and parsed.scheme not in {"http", "https"}:
            return
        if parsed.netloc and parsed.netloc not in ALLOWED_HOSTS:
            return
        path = parsed.path or "/"
        if parsed.query:
            path = f"{path}?{parsed.query}"
        if not path.startswith("/"):
            path = "/" + path
        self.links.add(path)


def fetch(path: str):
    url = urllib.parse.urljoin(BASE_URL, path)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        content_type = resp.headers.get("Content-Type", "")
        body = resp.read()
        status = resp.status
    return status, content_type, body


def crawl() -> Dict[str, PageInfo]:
    visited: Set[str] = set()
    queue: deque[str] = deque(["/"])
    site_map: Dict[str, PageInfo] = {}

    while queue and len(visited) < MAX_PAGES:
        path = queue.popleft()
        if path in visited:
            continue
        try:
            status, content_type, body = fetch(path)
        except Exception as exc:  # noqa: BLE001
            site_map[path] = PageInfo(
                status="error",
                content_type="",
                links=[],
                error=str(exc),
            )
            visited.add(path)
            continue

        links: List[str] = []
        if "text/html" in content_type:
            parser = LinkCollector()
            parser.feed(body.decode("utf-8", errors="ignore"))
            links = sorted(parser.links)
            for link in links:
                if link not in visited:
                    queue.append(link)

        site_map[path] = PageInfo(status=status, content_type=content_type, links=links)
        visited.add(path)
        time.sleep(REQUEST_DELAY)

    return site_map


def main() -> None:
    site_map = crawl()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = {path: info.to_dict() for path, info in sorted(site_map.items())}
    OUTPUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"Discovered {len(site_map)} entries -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
