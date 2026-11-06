#!/usr/bin/env python3
"""Safely unpack one offline HLS MPEG-TS rendition from an uploaded ZIP.

Usage: python3 -I scripts/ingest_hls.py input.zip output_directory
Prints one metadata JSON object. No transcoding or external dependencies.
"""
import json
import math
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import zipfile

MAX_FILES = 15000
MAX_UNPACKED = 1500 * 1024 * 1024
MAX_SEGMENT = 24 * 1024 * 1024
MAX_PLAYLIST = 2 * 1024 * 1024
SAFE_NAME = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(?:ts|m3u8)\Z")
EXTINF = re.compile(r"#EXTINF:([0-9]+(?:\.[0-9]+)?)(?:,.*)?\Z")


def fail(message):
    raise ValueError(message)


def validate_playlist(text):
    rows = [row.strip() for row in text.lstrip("\ufeff").splitlines() if row.strip()]
    if not rows or rows[0] != "#EXTM3U":
        fail("В пакете отсутствует корректный плейлист #EXTM3U.")
    if "#EXT-X-ENDLIST" not in rows:
        fail("Требуется завершенный HLS VOD с #EXT-X-ENDLIST.")
    if any(row.startswith(("#EXT-X-STREAM-INF", "#EXT-X-MEDIA:", "#EXT-X-KEY:",
                           "#EXT-X-MAP:", "#EXT-X-BYTERANGE:", "#EXT-X-I-FRAME-STREAM-INF",
                           "#EXT-X-DISCONTINUITY")) for row in rows):
        fail("Пока поддерживается один незашифрованный MPEG-TS HLS-поток без дискретностей.")

    segments = []
    seen = set()
    pending = None
    total_ms = 0
    for row in rows[1:]:
        if row.startswith("#EXTINF:"):
            if pending is not None:
                fail("У сегмента нет имени файла.")
            m = EXTINF.fullmatch(row)
            if not m:
                fail("Некорректный EXTINF.")
            duration = float(m.group(1))
            if not (0.1 <= duration <= 30 and math.isfinite(duration)):
                fail("Продолжительность сегмента вне диапазона 0.1–30 с.")
            pending = duration
            continue
        if row.startswith("#"):
            continue
        if not SAFE_NAME.fullmatch(row) or not row.lower().endswith(".ts"):
            fail("В плейлисте допустимы только локальные .ts имена без каталогов или URL.")
        if pending is None:
            fail("Отсутствует EXTINF перед сегментом.")
        if row in seen:
            fail("Найден повторяющийся сегмент: " + row)
        seen.add(row)
        dur_ms = round(pending * 1000)
        segments.append({"file": row, "startMs": total_ms, "durationMs": dur_ms})
        total_ms += dur_ms
        pending = None
    if pending is not None or not segments:
        fail("Плейлист не содержит корректного списка сегментов.")
    if len(segments) > MAX_FILES or not 5000 <= total_ms <= 6 * 3600 * 1000:
        fail("Допускается видео продолжительностью от 5 секунд до 6 часов.")
    return segments, total_ms


def main(archive, dest):
    dest = Path(dest).resolve()
    if dest.exists():
        fail("Каталог назначения уже существует.")
    with zipfile.ZipFile(archive) as z:
        infos = [item for item in z.infolist() if not item.is_dir()]
        if not 2 <= len(infos) <= MAX_FILES + 1:
            fail("Недопустимое число файлов в HLS ZIP.")
        indexes = [item.filename for item in infos if item.filename.endswith("/index.m3u8") or item.filename == "index.m3u8"]
        if len(indexes) != 1:
            fail("Архив должен содержать ровно один index.m3u8.")
        prefix = indexes[0][:-len("index.m3u8")]
        names = {}
        total = 0
        for item in infos:
            original = item.filename
            if "\\" in original or original.startswith("/") or not original.startswith(prefix):
                fail("Недопустимый путь ZIP: " + original[:90])
            relative = original[len(prefix):]
            if not SAFE_NAME.fullmatch(relative):
                fail("Архив должен содержать только index.m3u8 и сегменты .ts в одном каталоге.")
            if relative in names:
                fail("Дублирующееся имя ZIP.")
            if stat.S_IFMT(item.external_attr >> 16) == stat.S_IFLNK:
                fail("Символические ссылки в ZIP запрещены.")
            max_one = MAX_PLAYLIST if relative == "index.m3u8" else MAX_SEGMENT
            if item.file_size > max_one or item.file_size <= 0:
                fail("Слишком большой или пустой файл: " + relative)
            total += item.file_size
            if total > MAX_UNPACKED:
                fail("Суммарный распакованный объем больше 1.5 ГБ.")
            names[relative] = item

        playlist_bytes = z.read(names["index.m3u8"])
        playlist = playlist_bytes.decode("utf-8-sig")
        segments, duration_ms = validate_playlist(playlist)
        if {item["file"] for item in segments} != set(names) - {"index.m3u8"}:
            fail("Архив содержит лишние файлы или не все сегменты из плейлиста.")

        dest.mkdir(parents=True, mode=0o700)
        try:
            for name, info in names.items():
                with z.open(info, "r") as src, (dest / name).open("xb") as dst:
                    shutil.copyfileobj(src, dst, 64 * 1024)
            metadata = {"durationSeconds": duration_ms / 1000, "segments": segments,
                        "bytes": total}
            (dest / "manifest.json").write_text(json.dumps(metadata, separators=(",", ":")), "utf-8")
        except Exception:
            shutil.rmtree(dest, ignore_errors=True)
            raise
    print(json.dumps(metadata, separators=(",", ":")))


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            fail("Usage: ingest_hls.py input.zip output_directory")
        main(sys.argv[1], sys.argv[2])
    except (OSError, ValueError, zipfile.BadZipFile, UnicodeError) as error:
        print("Ошибка HLS: " + str(error), file=sys.stderr)
        sys.exit(1)
