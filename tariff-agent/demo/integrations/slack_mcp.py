"""
Stub for the Slack MCP integration.

In the real architecture these would be MCP tool calls against a live Slack
connector (e.g. mcp__slack__post_message, then polling/waiting on a reply in
the same thread for approval). Here they just print to the console and
auto-approve, so the demo is runnable without a real workspace.
"""

OPS_CHANNEL = "#customs-ops"


def post_message(text):
    """Stand-in for an FYI notification with no approval required."""
    print(f"  [Slack MCP] -> {OPS_CHANNEL}: {text}")


def request_approval(text):
    """
    Stand-in for posting an approval request and waiting for a human reply
    in the same thread. Real version would block (or return control and
    resume on a later webhook) until someone replies "approve" / "reject".
    """
    print(f"  [Slack MCP] -> {OPS_CHANNEL} (approval requested): {text}")
    print("  [Slack MCP]    (demo stub: simulating a human reply of 'approve')")
    return True
