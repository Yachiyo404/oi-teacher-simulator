#!/usr/bin/env python3
"""Rename OpenClaw sessions by adding/updating a label in sessions.json."""
import json
import sys
import os
from pathlib import Path


def find_session_store() -> str:
    """Find the main agent's sessions.json."""
    default = os.path.expanduser("~/.openclaw/agents/main/sessions/sessions.json")
    if os.path.exists(default):
        return default
    raise FileNotFoundError("Cannot find sessions.json for main agent")


def load_sessions(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


def save_sessions(path: str, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def list_sessions(data: dict) -> None:
    """List sessions with their keys and labels."""
    print(f"{'#':<3} {'Session Key':<70} {'Label'}")
    print("-" * 100)
    for i, (key, entry) in enumerate(data.items(), 1):
        label = entry.get("label", "(none)")
        updated = entry.get("updatedAt", 0)
        print(f"{i:<3} {key:<70} {label}")
    print()


def rename_session(data: dict, key_hint: str, new_label: str) -> bool:
    """Rename a session by key or partial match."""
    # Try exact match first
    if key_hint in data:
        data[key_hint]["label"] = new_label
        return True

    # Try partial match
    matches = [(k, v) for k, v in data.items() if key_hint.lower() in k.lower()]
    if len(matches) == 1:
        matches[0][1]["label"] = new_label
        print(f"Matched: {matches[0][0]}")
        return True
    elif len(matches) > 1:
        print(f"Multiple matches for '{key_hint}':")
        for k, v in matches:
            label = v.get("label", "(none)")
            print(f"  {k}  [{label}]")
        print("Use a more specific key.")
        return False
    else:
        print(f"No session found matching '{key_hint}'")
        return False


def clear_label(data: dict, key_hint: str) -> bool:
    """Remove the label from a session."""
    if key_hint in data:
        data[key_hint].pop("label", None)
        return True
    
    matches = [(k, v) for k, v in data.items() if key_hint.lower() in k.lower()]
    if len(matches) == 1:
        matches[0][1].pop("label", None)
        print(f"Cleared label from: {matches[0][0]}")
        return True
    elif len(matches) > 1:
        print(f"Multiple matches for '{key_hint}'")
        return False
    else:
        print(f"No session found matching '{key_hint}'")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  session-rename.py list")
        print("  session-rename.py rename <key-hint> <new-label>")
        print("  session-rename.py clear <key-hint>")
        sys.exit(1)

    action = sys.argv[1]
    path = find_session_store()
    data = load_sessions(path)

    if action == "list":
        list_sessions(data)
    elif action == "rename":
        if len(sys.argv) < 4:
            print("Usage: session-rename.py rename <key-hint> <new-label>")
            sys.exit(1)
        key_hint = sys.argv[2]
        new_label = sys.argv[3]
        if rename_session(data, key_hint, new_label):
            save_sessions(path, data)
            print(f"✅ Renamed to: {new_label}")
    elif action == "clear":
        if len(sys.argv) < 3:
            print("Usage: session-rename.py clear <key-hint>")
            sys.exit(1)
        key_hint = sys.argv[2]
        if clear_label(data, key_hint):
            save_sessions(path, data)
            print("✅ Label cleared")
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)


if __name__ == "__main__":
    main()
