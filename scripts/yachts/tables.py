"""Generate the viewer-friendly tables from the authoritative researched catalog JSON."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq


def flatten(model, keys):
    row = {key: model[key] for key in ["id", "brand", "name", "range", "type", "generation", "productionStart", "productionEnd", "productionStatus", "referenceConfiguration"]}
    row.update(model["dimensions"])
    row.update({"aliases": json.dumps(model["aliases"], ensure_ascii=False), "cabins": model["layout"]["cabins"], "heads": model["layout"]["heads"], "decks": model["layout"]["decks"], "layoutDescription": model["layout"]["description"], "uncertainties": json.dumps(model["uncertainties"], ensure_ascii=False), "sources": json.dumps(model["sources"], ensure_ascii=False)})
    facts = {fact["key"]: fact for fact in model["facts"]}
    if len(facts) != len(model["facts"]):
        raise ValueError(f"Duplicate fact keys: {model['id']}")
    for key in keys:
        fact = facts.get(key)
        for field in ["value", "unit", "status", "sourceUrl", "note"]:
            value = fact.get(field) if fact else None
            row[f"spec_{key}_{field}"] = None if value is None else str(value)
    return row


def write_tables(source: Path, destination: Path):
    models = json.loads(source.read_text(encoding="utf-8"))
    keys = sorted({fact["key"] for model in models for fact in model["facts"]})
    rows = [flatten(model, keys) for model in models]
    if not rows:
        raise ValueError("Cannot export an empty catalog.")
    integer_columns = {"productionStart", "productionEnd", "cabins", "heads", "decks"}
    float_columns = {"lengthM", "beamM", "draftM"}
    schema = pa.schema([(key, pa.int64() if key in integer_columns else pa.float64() if key in float_columns else pa.string()) for key in rows[0]])
    table = pa.Table.from_pylist(rows, schema=schema)
    destination.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, destination / "catalog.parquet", compression="zstd")
    # A blank CSV cell denotes null. Parquet and JSON preserve actual null values.
    with (destination / "catalog.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        for row in rows:
            writer.writerow({key: "'" + value if isinstance(value, str) and value.startswith(("=", "+", "-", "@", "\t", "\r")) else value for key, value in row.items()})
    (destination / "catalog.json").write_text(json.dumps(models, ensure_ascii=False, indent=2), encoding="utf-8")
    roundtrip = pq.read_table(destination / "catalog.parquet")
    if roundtrip.to_pylist() != rows:
        raise ValueError("Parquet round-trip changed catalog values.")
    print(json.dumps({"rows": len(rows), "columns": len(rows[0]), "parquetBytes": (destination / "catalog.parquet").stat().st_size, "publicRelease": False}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    write_tables(args.source, args.destination)
