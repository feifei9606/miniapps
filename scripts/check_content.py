#!/usr/bin/env python3
"""校验 companion 应用的内容 JSON：schema、引用完整性、章号连续性与体例。

用法：
    python3 scripts/check_content.py
    python3 scripts/check_content.py --toc /tmp/gjsx_extract/chapters_index.json

默认从 tools/math-thought-companion/data/ 读取数据；若 /tmp 下存在抽取索引，
会额外核对每章小节标题是否与原书 toc 一致（不依赖原书即可运行）。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "tools" / "math-thought-companion" / "data"
DEFAULT_TOC = Path("/tmp/gjsx_extract/chapters_index.json")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        err(f"{path.relative_to(ROOT)}: JSON 解析失败 — {exc}")
        return None


def normalize(text: str) -> str:
    """比较标题时忽略排版用的空格与全角空格。"""
    return re.sub(r"[\s\u3000]+", "", text)


REQUIRED_CHAPTER_KEYS = {
    "id": str,
    "no": int,
    "title": str,
    "era": str,
    "lead": str,
    "background": list,
    "coreQuestions": list,
    "conclusions": list,
    "sections": list,
    "figures": list,
    "concepts": list,
    "links": dict,
    "quotes": list,
    "quiz": list,
}


def check_book(book: dict) -> tuple[dict, set]:
    chapter_ids = set()
    for key in ("meta", "volumes", "chapters", "timeline", "figures", "concepts"):
        if key not in book:
            err(f"book.json 缺少字段 {key}")
    if errors:
        return {}, set()

    meta = book["meta"]
    for key in ("title", "author", "scope", "intro"):
        if not meta.get(key):
            err(f"book.json meta.{key} 为空")

    chapters = {c["id"]: c for c in book["chapters"]}
    chapter_ids = set(chapters)
    nums = sorted(c["no"] for c in book["chapters"])
    if nums != list(range(1, len(nums) + 1)):
        err(f"book.json chapters 章号不连续：{nums}")

    # 各册章号与 volume 字段自洽（1: 1–13，2: 14–26，3: 27–51）
    def expect_volume(no: int) -> int:
        if no <= 13:
            return 1
        return 2 if no <= 26 else 3

    for c in book["chapters"]:
        if c["volume"] != expect_volume(c["no"]):
            err(f"{c['id']}: volume={c['volume']} 与章号区间不符（应为 {expect_volume(c['no'])}）")

    for v in book["volumes"]:
        for cid in v.get("chapters", []):
            if cid not in chapters:
                err(f"volumes.{v['id']} 引用了不存在的章 {cid}")
    pub = {cid for v in book["volumes"] if v["status"] == "published" for cid in v["chapters"]}
    if pub != chapter_ids:
        err(f"已发布册的章列表与 chapters 不一致：缺 {chapter_ids - pub}，多 {pub - chapter_ids}")

    # 时间轴
    years = []
    for i, t in enumerate(book["timeline"]):
        for key in ("year", "label", "text", "chapter", "kind"):
            if key not in t:
                err(f"timeline[{i}] 缺少 {key}")
        if t.get("chapter") not in chapters:
            err(f"timeline[{i}] 指向不存在的章 {t.get('chapter')}")
        years.append(t.get("year"))
    if years != sorted(years):
        err("timeline 未按 year 升序排列")

    # 人物
    fig_ids = {f["id"] for f in book["figures"]}
    if len(fig_ids) != len(book["figures"]):
        err("book.json figures 存在重复 id")
    for f in book["figures"]:
        if not f.get("name") or not f.get("note"):
            err(f"figures.{f['id']} 缺少 name/note")
        for cid in f.get("chapters", []):
            if cid not in chapters:
                err(f"figures.{f['id']} 指向不存在的章 {cid}")

    # 概念
    con_ids = {c["id"] for c in book["concepts"]}
    if len(con_ids) != len(book["concepts"]):
        err("book.json concepts 存在重复 id")
    for c in book["concepts"]:
        if c.get("firstChapter") not in chapters:
            err(f"concepts.{c['id']} firstChapter 无效：{c.get('firstChapter')}")
        for key in ("name", "definition", "why"):
            if not c.get(key):
                err(f"concepts.{c['id']} 缺少 {key}")
        for ev in c.get("evolution", []):
            ev_chapter = ev.get("chapter")
            if ev_chapter not in chapters:
                # 第三册（27–51）可能尚未收录，允许作为“待补”提示
                if re.fullmatch(r"ch(2[7-9]|[3-4]\d|5[01])", ev_chapter or ""):
                    warn(f"concepts.{c['id']} evolution 指向尚未收录的第三册章 {ev_chapter}")
                else:
                    err(f"concepts.{c['id']} evolution 指向不存在的章 {ev_chapter}")
        for fid in c.get("figures", []):
            if fid not in fig_ids:
                err(f"concepts.{c['id']} 引用了不存在的人物 {fid}")

    return chapters, con_ids


def check_chapter(path: Path, data: dict, book_chapters: dict, concept_ids: set,
                  figure_ids: set, toc: dict | None) -> None:
    name = path.name
    for key, typ in REQUIRED_CHAPTER_KEYS.items():
        if key not in data:
            err(f"{name}: 缺少字段 {key}")
            continue
        if not isinstance(data[key], typ):
            err(f"{name}: 字段 {key} 类型应为 {typ.__name__}")

    cid = data.get("id")
    if f"{cid}.json" != name:
        err(f"{name}: id={cid} 与文件名不一致")
    if cid not in book_chapters:
        err(f"{name}: book.json chapters 中不存在 {cid}")
        return
    meta = book_chapters[cid]
    if data.get("title") != meta["title"]:
        err(f"{name}: title 与 book.json 不一致（{data.get('title')} / {meta['title']}）")
    if data.get("no") != meta["no"]:
        err(f"{name}: no 与 book.json 不一致")
    if data.get("era") != meta["era"]:
        warn(f"{name}: era 与 book.json 略有差异")

    # 章节首尾衔接
    prev_id = f"ch{meta['no'] - 1:02d}"
    next_id = f"ch{meta['no'] + 1:02d}"
    links = data.get("links", {})
    if meta["no"] > 1 and links.get("prev") != prev_id:
        err(f"{name}: links.prev 应为 {prev_id}，实为 {links.get('prev')}")
    if meta["no"] < len(book_chapters) and links.get("next") != next_id:
        err(f"{name}: links.next 应为 {next_id}，实为 {links.get('next')}")
    if not links.get("bridge"):
        err(f"{name}: links.bridge 为空")

    # 引用完整性
    for c in data.get("concepts", []):
        if c not in concept_ids:
            err(f"{name}: 引用了不存在的概念 {c}")
    for f in data.get("figures", []):
        if f not in figure_ids:
            err(f"{name}: 引用了不存在的人物 {f}")

    # 体例
    if not 3 <= len(data.get("quiz", [])) <= 5:
        err(f"{name}: quiz 应有 3–5 题，实有 {len(data.get('quiz', []))}")
    for i, q in enumerate(data.get("quiz", [])):
        for key in ("q", "hint", "answer"):
            if not q.get(key):
                err(f"{name}: quiz[{i}] 缺少 {key}")
    if not 2 <= len(data.get("coreQuestions", [])) <= 4:
        warn(f"{name}: coreQuestions 建议 2–4 条")
    if not 3 <= len(data.get("conclusions", [])) <= 6:
        warn(f"{name}: conclusions 建议 3–6 条")
    if not data.get("background"):
        err(f"{name}: background 为空")
    for i, q in enumerate(data.get("quotes", [])):
        if len(q.get("text", "")) > 140:
            err(f"{name}: quotes[{i}] 超过 140 字，超出合理引用范围")
        if not q.get("source"):
            err(f"{name}: quotes[{i}] 缺少 source")

    # 动作一：读前诊断
    entry = data.get("entryCheck")
    if entry is not None:
        items = entry.get("items", [])
        if not 3 <= len(items) <= 5:
            err(f"{name}: entryCheck 应有 3–5 题，实有 {len(items)}")
        for i, item in enumerate(items):
            opts = item.get("options", [])
            if not 3 <= len(opts) <= 4:
                err(f"{name}: entryCheck[{i}] 应有 3–4 个选项，实有 {len(opts)}")
            correct = [o for o in opts if o.get("correct")]
            if len(correct) != 1:
                err(f"{name}: entryCheck[{i}] 必须恰有 1 个正确项，实有 {len(correct)}")
            for j, opt in enumerate(opts):
                if not opt.get("text"):
                    err(f"{name}: entryCheck[{i}].options[{j}] 缺少 text")
                if opt.get("correct"):
                    continue
                gap = opt.get("gap")
                if not gap:
                    err(f"{name}: entryCheck[{i}].options[{j}] 是错误项但没有 gap")
                elif gap not in concept_ids:
                    err(f"{name}: entryCheck[{i}].options[{j}].gap 指向不存在的概念 {gap}")
        paths = entry.get("paths", {})
        for key in ("ready", "patch", "lite"):
            if key not in paths:
                err(f"{name}: entryCheck.paths 缺少 {key}")
        for pid in paths.get("patch", {}).get("concepts", []):
            if pid not in concept_ids:
                err(f"{name}: entryCheck.paths.patch 引用了不存在的概念 {pid}")

    # 动作二：历史语境卡
    card = data.get("contextCard")
    if card is not None:
        if not card.get("tools"):
            err(f"{name}: contextCard.tools 为空")
        for i, tool in enumerate(card.get("tools", [])):
            for key in ("name", "note"):
                if not tool.get(key):
                    err(f"{name}: contextCard.tools[{i}] 缺少 {key}")
        for key in ("limits", "consequence", "misread"):
            if not card.get(key):
                err(f"{name}: contextCard 缺少 {key}")

    # 动作四：小节级卡点
    for i, section in enumerate(data.get("sections", [])):
        trouble = section.get("trouble")
        if not trouble:
            continue
        if not trouble.get("symptom"):
            err(f"{name}: sections[{i}].trouble 缺少 symptom")
        bt = trouble.get("backtrack", [])
        # 小节级允许 1–3 项：总览型小节（如“留给后代的问题”）天然指向多个方向
        if not 1 <= len(bt) <= 3:
            err(f"{name}: sections[{i}].trouble.backtrack 应有 1–3 项，实有 {len(bt)}")
        for k, step in enumerate(bt):
            if not step.get("why"):
                err(f"{name}: sections[{i}].trouble.backtrack[{k}] 缺少 why")
            if "concept" in step:
                if step["concept"] not in concept_ids:
                    err(f"{name}: sections[{i}].trouble.backtrack[{k}] 指向不存在的概念 {step['concept']}")
            elif "chapter" in step:
                if step["chapter"] not in book_chapters:
                    err(f"{name}: sections[{i}].trouble.backtrack[{k}] 指向不存在的章 {step['chapter']}")
                if not step.get("label"):
                    err(f"{name}: sections[{i}].trouble.backtrack[{k}] 缺少 label")
            else:
                err(f"{name}: sections[{i}].trouble.backtrack[{k}] 需要 concept 或 chapter")

    # 小节标题与原书 toc 对照（忽略排版空格与章末“参考书目”）
    if toc is not None:
        entry = toc.get(cid)
        if entry is None:
            warn(f"{name}: 抽取索引中无此章，跳过 toc 校验")
        else:
            toc_sections = [s for s in entry["sections"] if normalize(s) != "参考书目"]
            mine = [s["label"] for s in data.get("sections", [])]
            if [normalize(s) for s in mine] != [normalize(s) for s in toc_sections]:
                err(f"{name}: sections 与 toc 不一致\n  数据: {mine}\n  toc : {toc_sections}")
            for i, s in enumerate(data.get("sections", [])):
                if not s.get("gist"):
                    err(f"{name}: sections[{i}] 缺少 gist")


def check_notes(path: Path, book: dict) -> int:
    """校验概念注释层：现代翻译注、卡点回溯、演化边性质。返回条目数。"""
    data = load(path)
    if data is None:
        return 0
    notes = data.get("notes", {})
    concepts = {c["id"]: c for c in book.get("concepts", [])}
    chapters = {c["id"] for c in book.get("chapters", [])}

    for cid, entry in notes.items():
        if cid not in concepts:
            err(f"concept-notes.json: {cid} 不在 book.json 的 concepts 中")
            continue

        modern = entry.get("modernNote", {})
        for key in ("similar", "different", "function"):
            if not modern.get(key):
                err(f"concept-notes.json: {cid}.modernNote 缺少 {key}")

        trouble = entry.get("trouble")
        if trouble:
            if not trouble.get("symptom"):
                err(f"concept-notes.json: {cid}.trouble 缺少 symptom")
            bt = trouble.get("backtrack", [])
            if not 1 <= len(bt) <= 2:
                err(f"concept-notes.json: {cid}.trouble.backtrack 应有 1–2 项，实有 {len(bt)}")
            for k, step in enumerate(bt):
                if not step.get("why"):
                    err(f"concept-notes.json: {cid}.trouble.backtrack[{k}] 缺少 why")
                if "concept" in step:
                    if step["concept"] not in concepts:
                        err(f"concept-notes.json: {cid}.trouble.backtrack[{k}] 指向不存在的概念 {step['concept']}")
                elif "chapter" in step:
                    if step["chapter"] not in chapters:
                        err(f"concept-notes.json: {cid}.trouble.backtrack[{k}] 指向不存在的章 {step['chapter']}")
                    if not step.get("label"):
                        err(f"concept-notes.json: {cid}.trouble.backtrack[{k}] 缺少 label")
                else:
                    err(f"concept-notes.json: {cid}.trouble.backtrack[{k}] 需要 concept 或 chapter")

        evo = {e["chapter"] for e in concepts[cid].get("evolution", [])}
        for ch, edge in (entry.get("edges") or {}).items():
            if edge.get("type") not in ("problem", "response", "inherit"):
                err(f"concept-notes.json: {cid}.edges.{ch} 的 type 必须是 problem/response/inherit")
            if ch not in evo:
                warn(f"concept-notes.json: {cid}.edges.{ch} 不在该概念的 evolution 章节中")
            if edge.get("type") == "problem" and not edge.get("gap"):
                err(f"concept-notes.json: {cid}.edges.{ch} 是 problem 但缺少 gap 描述")

    return len(notes)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--toc", default=str(DEFAULT_TOC), help="extract_gjsx.py 产出的 chapters_index.json")
    ap.add_argument("--data", default=str(DATA), help="数据目录")
    args = ap.parse_args()

    data_dir = Path(args.data)
    book_path = data_dir / "book.json"
    if not book_path.is_file():
        sys.exit(f"找不到 {book_path}")
    book = load(book_path)
    if book is None:
        sys.exit("book.json 无法解析")
    chapters_meta, concept_ids = check_book(book)
    figure_ids = {f["id"] for f in book.get("figures", [])}

    toc = None
    toc_path = Path(args.toc)
    if toc_path.is_file():
        raw = json.loads(toc_path.read_text(encoding="utf-8"))
        toc = {f"ch{item['no']:02d}": item for item in raw}
    else:
        warn(f"未找到抽取索引 {toc_path}，跳过小节标题核对")

    files = sorted((data_dir / "chapters").glob("ch*.json"))
    if len(files) != len(chapters_meta):
        err(f"章节文件数 {len(files)} 与 book.json 章数 {len(chapters_meta)} 不一致")
    action_chapters = []
    for path in files:
        payload = load(path)
        if payload is None:
            continue
        check_chapter(path, payload, chapters_meta, concept_ids, figure_ids, toc)
        if payload.get("entryCheck") and payload.get("contextCard"):
            action_chapters.append(payload.get("id"))

    notes_path = data_dir / "concept-notes.json"
    note_count = 0
    if notes_path.is_file():
        note_count = check_notes(notes_path, book)
    else:
        warn("未找到 concept-notes.json，跳过现代翻译注与卡点校验")

    for w in warnings:
        print(f"[warn] {w}")
    for e in errors:
        print(f"[error] {e}")
    print(f"\n检查完成：{len(files)} 章，{len(book.get('concepts', []))} 个概念，"
          f"{len(book.get('figures', []))} 位人物，{len(book.get('timeline', []))} 条时间轴事件")
    print(f"四动作覆盖：{len(action_chapters)} 章具备诊断与语境卡（{'、'.join(action_chapters) or '无'}），"
          f"翻译注 {note_count} 条")
    print("结果：" + ("通过" if not errors else f"{len(errors)} 处错误"))
    sys.exit(0 if not errors else 1)


if __name__ == "__main__":
    main()
