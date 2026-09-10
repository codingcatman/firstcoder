"""
Stub for the Outlook MCP integration.

In the real architecture these two functions would be MCP tool calls against
a live Outlook connector (e.g. mcp__outlook__list_messages /
mcp__outlook__send_mail). Here they just read local mock data and print what
would be sent, so the demo runs with no auth and no network access.
"""

import json
from pathlib import Path

INBOX_PATH = Path(__file__).resolve().parent.parent / "mock_data" / "inbox.json"


def read_inbox():
    """Return unread messages from the tariff-alerts mailbox."""
    with open(INBOX_PATH, encoding="utf-8") as f:
        messages = json.load(f)
    return [m for m in messages if not m["read"]]


def send_email(to, subject, body):
    """Stand-in for sending/forwarding a corrected document by email."""
    print(f"  [Outlook MCP] -> to: {to}")
    print(f"  [Outlook MCP]    subject: {subject}")
    print(f"  [Outlook MCP]    body: {body}")
