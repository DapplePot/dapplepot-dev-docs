#!/usr/bin/env python3
"""Generates the JSON API reference for this docs site from an installed
dapplepot-sdk's own docstrings.

Lives here (in the docs repo), not inside dapplepot-sdk — the SDK package
has no idea it's being documented. This script imports whatever
dapplepot-sdk version generate-api-reference.mjs installed into
.venv-docgen, introspects a hardcoded list of public names (see
PUBLIC_API below) via `inspect`, and parses their Google-style docstrings
via `docstring_parser`. Prints one JSON document to stdout.

When dapplepot-sdk adds a new public class, add its name to PUBLIC_API
below so it shows up here too.
"""

from __future__ import annotations

import datetime
import inspect
import json
import re
import sys
from importlib.metadata import PackageNotFoundError
from importlib.metadata import metadata as _pkg_metadata
from importlib.metadata import version as _pkg_version

from docstring_parser.google import parse as _parse_docstring

import dapplepot_sdk
import dapplepot_sdk.scrubbers as scrubbers

# Hand-maintained list of what shows up on the public API reference page.
# Update this when dapplepot-sdk adds/removes public classes.
PUBLIC_API = {
    "dapplepot_sdk": (dapplepot_sdk, ["DapplePot", "DapplePotBlockedError", "DapplePotSessionTerminatedError"]),
    "dapplepot_sdk.scrubbers": (scrubbers, ["BaseScrubber", "RegexScrubber"]),
}

# Which install extras to surface as "compatibility" info on the docs site.
# "all" and "docgen" are deliberately excluded — "all" just repeats the
# others, and "docgen" is build tooling, not a user-facing integration.
_DISPLAY_EXTRAS = ("anthropic", "openai", "langchain")

_REQUIRES_DIST_RE = re.compile(
    r'^([A-Za-z0-9_.-]+)\s*([^;]*?)\s*(?:;\s*extra\s*==\s*"([^"]+)")?$'
)


def _build_requirements() -> dict:
    """Pull Python/framework version requirements straight from the installed
    package's metadata (Requires-Python, Requires-Dist per extra) — sourced
    from the real wheel, not hand-typed, so it can't drift from what
    dapplepot-sdk's pyproject.toml actually declares.
    """
    try:
        meta = _pkg_metadata("dapplepot-sdk")
    except PackageNotFoundError:
        return {"python": None, "extras": {}}

    extras: dict[str, list[str]] = {}
    for req in meta.get_all("Requires-Dist") or []:
        m = _REQUIRES_DIST_RE.match(req)
        if not m:
            continue
        name, specifier, extra = m.groups()
        if extra not in _DISPLAY_EXTRAS:
            continue
        extras.setdefault(extra, []).append(f"{name}{specifier}".strip())

    return {"python": meta.get("Requires-Python"), "extras": extras}


def _docstring_sections(doc: str | None) -> dict:
    """Parse a Google-style docstring into the JSON schema's docstring shape.

    A docstring's ``Args:``/``Parameters:`` section and its ``Attributes:``
    section both parse into ``docstring_parser``'s unified ``.params`` list —
    the only way to tell them apart is ``param.args[0]`` (``'param'`` vs
    ``'attribute'``). We split them back out here: ``args`` is rendered on
    method cards (input parameters), ``attributes`` is rendered on the class
    header (instance attributes — e.g. what's on a caught exception).
    """
    if not doc:
        return {
            "summary": None, "description": None,
            "args": [], "attributes": [], "returns": None, "raises": [], "examples": [],
        }
    parsed = _parse_docstring(doc)
    args = [p for p in parsed.params if (p.args[0] if p.args else "param") != "attribute"]
    attributes = [p for p in parsed.params if p.args and p.args[0] == "attribute"]
    return {
        "summary": parsed.short_description,
        "description": parsed.long_description,
        "args": [
            {"name": p.arg_name, "type": p.type_name, "description": p.description}
            for p in args
        ],
        "attributes": [
            {"name": p.arg_name, "type": p.type_name, "description": p.description}
            for p in attributes
        ],
        "returns": (
            {"type": parsed.returns.type_name, "description": parsed.returns.description}
            if parsed.returns else None
        ),
        "raises": [
            {"type": r.type_name, "description": r.description}
            for r in parsed.raises
        ],
        "examples": [e.snippet or e.description for e in parsed.examples if (e.snippet or e.description)],
    }


def _signature_str(member) -> str:
    """Best-effort ``name(args...)`` string for a function/method."""
    try:
        return str(inspect.signature(member))
    except (TypeError, ValueError):
        return "(...)"


def _describe_callable(name: str, member) -> dict:
    return {
        "name": name,
        "signature": f"{name}{_signature_str(member)}",
        "is_property": isinstance(member, property),
        "docstring": _docstring_sections(inspect.getdoc(member)),
    }


def _own_public_methods(cls) -> list[dict]:
    """Methods/properties defined directly on ``cls`` (not inherited), public or __init__."""
    out = []
    for name, member in sorted(vars(cls).items()):
        if name.startswith("_") and name != "__init__":
            continue
        if isinstance(member, property):
            out.append(_describe_callable(name, member.fget or member))
        elif inspect.isfunction(member):
            out.append(_describe_callable(name, member))
    return out


def _describe_class(cls) -> dict:
    return {
        "name": cls.__name__,
        "docstring": _docstring_sections(inspect.getdoc(cls)),
        "methods": _own_public_methods(cls),
    }


def build_reference() -> dict:
    """Build the full API reference document as a plain dict."""
    modules = []
    for module_name, (module, names) in PUBLIC_API.items():
        classes = [_describe_class(getattr(module, name)) for name in names]
        modules.append({"name": module_name, "classes": classes})

    try:
        sdk_version = _pkg_version("dapplepot-sdk")
    except PackageNotFoundError:
        sdk_version = "0.0.0-dev"

    return {
        "sdk_version": sdk_version,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "modules": modules,
        "requirements": _build_requirements(),
    }


def main() -> None:
    json.dump(build_reference(), sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
