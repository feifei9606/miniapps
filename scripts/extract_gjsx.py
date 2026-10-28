#!/usr/bin/env python3
"""从《古今数学思想》azw3 / epub 抽取伴读内容所需的素材。

本脚本只用于本地内容生产，产物写到 /tmp（不入库），原书与抽取文本均不得提交。

用法：
    # 依赖：mobi（azw3 解包）。建议装在独立 venv 里，例如
    #   python3 -m venv /tmp/kf8venv
    #   /tmp/kf8venv/bin/pip install -i https://pypi.tuna.tsinghua.edu.cn/simple mobi
    python3 scripts/extract_gjsx.py --input /path/to/book.azw3 --out /tmp/gjsx_extract
    python3 scripts/extract_gjsx.py --input /path/to/book.epub --volume 1

产物：
    <out>/chapters_index.json     章号 → 源文件、字数、小节标题
    <out>/chNN_brief.txt          每章的素材摘要（小节首段 + 含年份/人名的句子）
    <out>/chNN_full.txt           每章纯文本（供人工核对，勿提交）
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
import tempfile
import zipfile
from html.parser import HTMLParser
from pathlib import Path

CN_NUM = "零一二三四五六七八九十百"


class _TextExtractor(HTMLParser):
    """把 xhtml 拆成 (块类型, 文本) 序列，块类型为 h1/h2/h3/p。"""

    BLOCK_TAGS = {"h1", "h2", "h3", "p"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[tuple[str, str]] = []
        self._tag: str | None = None
        self._buf: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "img":
            # 书中的行内公式以图片形式存在，保留占位，避免句子断裂
            if self._tag is not None:
                self._buf.append("[式]")
            return
        if tag == "br" and self._tag is not None:
            self._buf.append(" ")
            return
        if tag in self.BLOCK_TAGS:
            if self._tag is not None:  # 嵌套块（如 p 内 span 之外的结构）忽略外层
                return
            self._tag = tag
            self._buf = []

    def handle_endtag(self, tag):
        if tag == self._tag and tag in self.BLOCK_TAGS:
            text = re.sub(r"\s+", " ", "".join(self._buf)).strip()
            if text:
                self.blocks.append((tag, text))
            self._tag = None
            self._buf = []

    def handle_data(self, data):
        if self._tag is not None:
            self._buf.append(data)


def _parse(html_text: str) -> list[tuple[str, str]]:
    parser = _TextExtractor()
    parser.feed(html_text)
    return parser.blocks


def _strip_noise(text: str) -> str:
    # 去掉页眉页脚式的孤立页码、目录引导点
    text = re.sub(r"[\.·]{4,}", " ", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def resolve_epub(input_path: Path) -> tuple[Path, tempfile.TemporaryDirectory | None]:
    """azw3 → 解出 epub；已是 epub 则原样返回。"""
    if input_path.suffix.lower() in {".epub"}:
        return input_path, None
    try:
        import mobi  # type: ignore
    except ImportError:  # pragma: no cover - 环境提示
        sys.exit(
            "缺少 mobi 依赖。请先执行：\n"
            "  python3 -m venv /tmp/kf8venv\n"
            "  /tmp/kf8venv/bin/pip install -i https://pypi.tuna.tsinghua.edu.cn/simple mobi\n"
            "然后用 /tmp/kf8venv/bin/python 重新运行本脚本。"
        )
    keep = Path(tempfile.mkdtemp(prefix="gjsx_unpack_"))
    tempdir, epub_path = mobi.extract(str(input_path))
    # mobi.extract 的输出目录由它自己创建，复制到我们可管控的目录后清理
    target = keep / Path(epub_path).name
    shutil.copy2(epub_path, target)
    shutil.rmtree(tempdir, ignore_errors=True)
    cleanup = tempfile.TemporaryDirectory(prefix="gjsx_tmp_")
    Path(cleanup.name, "epub_dir").mkdir()
    return target, cleanup


def read_chapters(epub: Path) -> list[dict]:
    """按章读取正文，返回 [{no, title, src, blocks}]。"""
    with zipfile.ZipFile(epub) as zf:
        names = zf.namelist()
        # 章节文件：正文里 h1 形如「第3章　古典希腊数学的产生」
        chapter_files: list[tuple[int, str, str]] = []
        for name in names:
            if not name.lower().endswith((".xhtml", ".html", ".htm")):
                continue
            raw = zf.read(name).decode("utf-8", "ignore")
            m = re.search(r"<h1[^>]*>\s*(第\s*\d+\s*章[^<]*)</h1>", raw)
            if m:
                title = _strip_noise(html.unescape(m.group(1)))
                no = int(re.search(r"(\d+)", title).group(1))
                chapter_files.append((no, title, name))
        if not chapter_files:
            sys.exit(f"未在 {epub.name} 中找到任何「第N章」标题，请检查文件结构。")

        chapters = []
        for no, title, name in sorted(chapter_files):
            blocks = _parse(zf.read(name).decode("utf-8", "ignore"))
            chapters.append({"no": no, "title": title, "src": name, "blocks": blocks})
    return chapters


YEAR_RE = re.compile(r"(公元前\s*\d{2,4}\s*年?|公元\s*\d{2,4}\s*年?|(?:1[0-7]|20)\d{2}\s*年)")
NAME_HINT_RE = re.compile(r"(?<![\u4e00-\u9fa5])([A-Z][a-zA-Z\-]+(?:\s+[A-Z][a-zA-Z\-]+){0,3})")


def brief_of(chapter: dict) -> str:
    """生成单章素材摘要：小节标题 + 每节首段 + 含年份/生平的句子。"""
    lines: list[str] = [f"[章] {chapter['title']}  (src: {chapter['src']})"]
    body_chars = sum(len(t) for _, t in chapter["blocks"])
    lines.append(f"[正文规模] 约 {body_chars} 字，段落 {len(chapter['blocks'])} 段")
    section = "（章首导语）"
    seen_quote: set[str] = set()
    quote_budget = 0
    first_para_used = False

    def flush_section_header():
        lines.append("")
        lines.append(f"## {section}")

    flush_section_header()

    for tag, text in chapter["blocks"]:
        text = _strip_noise(text)
        if tag == "h1":
            continue
        if tag in ("h2", "h3"):
            section = text
            first_para_used = False
            quote_budget = 0
            flush_section_header()
            continue
        if tag != "p":
            continue

        # 每节首段：保留前 220 字
        if not first_para_used and len(text) > 20:
            lines.append("首段｜" + (text[:220] + ("…" if len(text) > 220 else "")))
            first_para_used = True
            continue

        # 其余段落：只挑含年份/生平信息、且不超过 3 句的，每节最多 2 条
        if quote_budget < 2 and YEAR_RE.search(text) and len(text) < 260:
            if text not in seen_quote:
                seen_quote.add(text)
                lines.append("史实｜" + text)
                quote_budget += 1

    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="抽取《古今数学思想》伴读素材")
    ap.add_argument("--input", required=True, help="azw3 或 epub 文件路径")
    ap.add_argument("--out", default="/tmp/gjsx_extract", help="输出目录（默认 /tmp/gjsx_extract）")
    ap.add_argument("--volume", type=int, default=1,
                    help="只保留该册的章号区间（1=第1-13章，2=14-26，3=27-51，0=全部）")
    args = ap.parse_args()

    input_path = Path(args.input).expanduser()
    if not input_path.is_file():
        sys.exit(f"找不到输入文件：{input_path}")

    epub, cleanup = resolve_epub(input_path)
    try:
        chapters = read_chapters(epub)
    finally:
        if cleanup is not None:
            cleanup.cleanup()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    ranges = {1: (1, 13), 2: (14, 26), 3: (27, 51), 0: (1, 999)}
    lo, hi = ranges.get(args.volume, (1, 999))

    index = []
    for ch in chapters:
        no = ch["no"]
        full = "\n".join(t for _, t in ch["blocks"])
        (out / f"ch{no:02d}_full.txt").write_text(full, encoding="utf-8")
        if not lo <= no <= hi:
            continue
        (out / f"ch{no:02d}_brief.txt").write_text(brief_of(ch), encoding="utf-8")
        sections = [t for tag, t in ch["blocks"] if tag in ("h2", "h3")]
        index.append(
            {
                "no": no,
                "title": ch["title"],
                "src": ch["src"],
                "chars": len(full),
                "sections": sections,
            }
        )

    (out / "chapters_index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"epub: {epub}")
    print(f"out:  {out}")
    print(f"章数: {len(index)}，章号: {[c['no'] for c in index]}")
    for c in index:
        print(f"  {c['no']:>2}  {c['chars']:>7} 字  {c['title']}")


if __name__ == "__main__":
    main()
