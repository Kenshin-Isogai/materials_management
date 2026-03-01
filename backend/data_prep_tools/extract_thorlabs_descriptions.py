"""Extract Thorlabs item descriptions from quotation PDFs.

This is a standalone utility script. It does not hook into the backend app.
"""

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

from pypdf import PdfReader


ROOT_DIR = Path(__file__).resolve().parents[2]
ITEM_LIST_PATH = ROOT_DIR / "item_lists" / "thorlabs_items_1st.csv"
SOURCE_CSV_DIR = ROOT_DIR / "quotations" / "unregistered" / "csv_files" / "thorlabs"
PDF_DIR = ROOT_DIR / "quotations" / "unregistered" / "pdf_files" / "thorlabs"


def normalize_line(text: str) -> str:
    text = text.replace("\u3000", " ").replace("\t", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_source_item_numbers() -> set[str]:
    items: set[str] = set()
    for csv_path in sorted(SOURCE_CSV_DIR.glob("*.csv")):
        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                item = (row.get("item_number") or "").strip()
                if item:
                    items.add(item)
    return items


def build_item_regex(item_numbers: set[str]) -> re.Pattern[str]:
    escaped = sorted((re.escape(x) for x in item_numbers), key=len, reverse=True)
    return re.compile(rf"^({'|'.join(escaped)})(?:\s+|$)")


def is_data_or_delivery_line(text: str) -> bool:
    if text in {"No", "Yes"}:
        return True
    if "JPY" in text:
        return True
    if re.match(r"^(即納可|別途記載|[0-9]+-[0-9]+日|[0-9]+週間)", text):
        return True
    if re.fullmatch(r"[0-9,\s./%-]+", text):
        return True
    return False


def is_header_footer_line(text: str) -> bool:
    markers = (
        "Page",
        "見積書",
        "納品書",
        "請求書",
        "請求先",
        "出荷先",
        "Date／日付",
        "Quotation Deadline",
        "Terms of Payment",
        "Invoice Account",
        "Sales Contact",
        "Sales Order",
        "Inv Date",
        "Purchase Order",
        "数量 納期",
        "型番 品名 数量",
        "小計（10%対象）",
        "合計（税込）",
        "株式会社Yaqumo",
        "京都大学",
        "大学院理学研究科",
        "登録番号",
        "Tel:",
        "Fax:",
    )
    if any(m in text for m in markers):
        return True
    if re.fullmatch(r"JQ[0-9-]+", text):
        return True
    return False


def clean_description(text: str) -> str:
    text = re.sub(r"(?<=\w)- (?=\w)", "-", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" -")


def choose_best_description(candidates: list[str]) -> str:
    counts = Counter(candidates)
    best, _ = max(counts.items(), key=lambda x: (x[1], len(x[0])))
    return best


def parse_pdf_descriptions(pdf_path: Path, item_pattern: re.Pattern[str]) -> dict[str, list[str]]:
    lines: list[str] = []
    reader = PdfReader(str(pdf_path))
    for page in reader.pages:
        text = page.extract_text() or ""
        for raw in text.splitlines():
            line = normalize_line(raw)
            if line:
                lines.append(line)

    extracted: dict[str, list[str]] = defaultdict(list)
    i = 0
    while i < len(lines):
        line = lines[i]
        match = item_pattern.match(line)
        if not match:
            i += 1
            continue

        item = match.group(1)
        rest = line[match.end() :].strip()
        desc_parts: list[str] = []
        if rest and not is_data_or_delivery_line(rest) and not is_header_footer_line(rest):
            desc_parts.append(rest)

        j = i + 1
        while j < len(lines):
            current = lines[j]
            if item_pattern.match(current):
                break
            if is_header_footer_line(current):
                if desc_parts:
                    break
                j += 1
                continue
            if is_data_or_delivery_line(current):
                if desc_parts:
                    break
                j += 1
                continue
            if current in {".", ","}:
                j += 1
                continue

            desc_parts.append(current)
            j += 1

        if desc_parts:
            desc = clean_description(" ".join(desc_parts))
            if desc:
                extracted[item].append(desc)

        i = j if j > i else i + 1

    return extracted


def update_item_list() -> None:
    source_items = load_source_item_numbers()
    item_pattern = build_item_regex(source_items)

    all_candidates: dict[str, list[str]] = defaultdict(list)
    pdf_paths = sorted(p for p in PDF_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".pdf")
    for pdf_path in pdf_paths:
        parsed = parse_pdf_descriptions(pdf_path, item_pattern)
        for item, descriptions in parsed.items():
            all_candidates[item].extend(descriptions)

    with ITEM_LIST_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else [
            "item_number",
            "manufacturer_name",
            "category",
            "url",
            "description",
        ]

    filled_count = 0
    preserved_count = 0
    missing_items: list[str] = []
    candidate_hits = 0

    for row in rows:
        item = (row.get("item_number") or "").strip()
        current_description = (row.get("description") or "").strip()
        extracted_description = ""
        if item in all_candidates:
            extracted_description = choose_best_description(all_candidates[item])
            candidate_hits += 1

        if current_description:
            preserved_count += 1
            continue
        if extracted_description:
            row["description"] = extracted_description
            filled_count += 1
        else:
            missing_items.append(item)

    with ITEM_LIST_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"PDF files scanned: {len(pdf_paths)}")
    print(f"Items in source CSVs: {len(source_items)}")
    print(f"Items with extracted description candidates: {candidate_hits}")
    print(f"Descriptions filled in item list: {filled_count}")
    print(f"Rows that already had descriptions and were preserved: {preserved_count}")
    print(f"Rows still missing descriptions: {len(missing_items)}")
    if missing_items:
        print("Missing item_numbers:")
        for item in missing_items:
            print(item)


if __name__ == "__main__":
    update_item_list()
