# claude-statusline

A compact status line for [Claude Code](https://code.claude.com), plus a small mod that shows each
subagent's own context usage on its row. Works on macOS, Linux and Windows.

```
Opus 5.5 medium · ~/Projects/app · 5h: 82% (3:35 hrs) · 7d: 37% (Thu 14:00) · ctx: 91% left
```

```
general-purpose  Reviewing the auth module and checking every…  ctx 94%    1m 3s · ↓ 41.5k tokens
```

## What it shows

### Status line (`statusline.sh`)

| Part | Example | Notes |
| --- | --- | --- |
| Model and effort | `Opus 5.5 medium` | Effort is left out on models that don't support it |
| Working directory | `~/Projects/app` | Home folder shortened to `~` |
| 5-hour limit | `5h: 82% (3:35 hrs)` | Percentage **remaining**, time until reset |
| 7-day limit | `7d: 37% (Thu 14:00)` | Percentage **remaining**, local reset day and time |
| Context window | `ctx: 91% left` | Percentage remaining |

- Only the percentages are colored: **green** above 50%, **yellow** 20–50%, **red** below 20%.
- Shows `--` while data isn't available yet (limits arrive after the first response of a session).
- No timer: Claude Code re-runs the script on new messages and when a limit window resets.
- The 5h and 7d limits appear only for claude.ai Pro, Max and Ultra subscribers.

### Subagent rows (`subagent-ctx/` mod)

Adds `ctx YY%` to the built-in row of each running subagent, using **that subagent's own** context
window, not the main session's.

- Keeps Claude Code's own row; nothing is redrawn.
- Uses Claude Code's native spacing: 2 columns after the description, 4 before the time.
- Long descriptions are trimmed with `…` so `ctx` is never cut off, at any terminal width.
- Shows `ctx --` for the first few seconds, until the subagent's first reading.

## Requirements

- **Claude Code** with mod support (tested on 2.1.332). The status line alone works on older versions.
- **bash** and **[jq](https://jqlang.org/)**.
  - macOS: `brew install jq`
  - Debian/Ubuntu: `sudo apt install jq` (Fedora: `sudo dnf install jq`)
  - Windows: install [Git for Windows](https://git-scm.com/download/win) (Claude Code runs status
    lines through its Git Bash), then `winget install jqlang.jq`. WSL works like Linux.

## Install

Clone the repo anywhere, then link both parts into `~/.claude` so that `git pull` updates them.

### macOS, Linux and WSL

```bash
git clone https://github.com/d4kshn/claude-statusline.git
cd claude-statusline
mkdir -p ~/.claude/mods
ln -s "$PWD/statusline.sh" ~/.claude/statusline.sh
ln -s "$PWD/subagent-ctx" ~/.claude/mods/subagent-ctx
```

### Windows (PowerShell)

Creating symlinks needs **Developer Mode** turned on (Settings → System → For developers), or an
administrator PowerShell.

```powershell
git clone https://github.com/d4kshn/claude-statusline.git
cd claude-statusline
New-Item -ItemType Directory -Force "$HOME\.claude\mods" | Out-Null
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\statusline.sh" -Target "$PWD\statusline.sh"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\mods\subagent-ctx" -Target "$PWD\subagent-ctx"
```

If you can't create symlinks, copy the file and folder there instead, and copy them again after
updating.

### Settings

Add this to `~/.claude/settings.json` (merge it with what's already there). The same settings work
on every OS; keep the forward slashes on Windows too.

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  },
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/subagent-ctx"
  }
}
```

On macOS and Linux, make sure the script is executable: `chmod +x statusline.sh`.

Restart Claude Code. The status line appears after your next message, and the `ctx` part shows on
subagent rows as soon as one is running.

## Customizing

- **Colors and thresholds:** `color_pct` in `statusline.sh`.
- **Separator:** `SEP` in `statusline.sh`.
- **Subagent row spacing:** `GAP` and `STATS_GAP` in `subagent-ctx/hooks/register.ts`.

## Testing

```bash
# mod tests and checks
claude plugin test subagent-ctx
claude plugin validate subagent-ctx

# status line with sample input
echo '{"model":{"display_name":"Opus 5.5"},"effort":{"level":"medium"},"workspace":{"current_dir":"'"$HOME"'/app"},"context_window":{"remaining_percentage":42}}' | ./statusline.sh
```

## Uninstall

1. In `~/.claude/settings.json`, delete the `statusLine` block and the `CLAUDE_CODE_PLUGIN_DIRS`
   line from `env` (and `env` itself if it's left empty).
2. Remove the links (or the copies, if you copied instead):

   macOS, Linux and WSL:

   ```bash
   rm ~/.claude/statusline.sh ~/.claude/mods/subagent-ctx
   rmdir ~/.claude/mods 2>/dev/null   # only removes it if empty
   ```

   Windows (PowerShell):

   ```powershell
   Remove-Item "$HOME\.claude\statusline.sh"
   (Get-Item "$HOME\.claude\mods\subagent-ctx").Delete()   # removes the link, not the repo folder
   ```

   If you copied the folder instead of linking it, use
   `Remove-Item -Recurse "$HOME\.claude\mods\subagent-ctx"`.
3. Restart Claude Code, then delete the cloned repo folder if you no longer need it.

## Notes

- Claude Code's mod API is marked early access, so a future release may change how subagent rows
  behave. The status line script doesn't depend on it.
- The subagent row layout (spacing, time and token formats) was matched by testing against Claude
  Code 2.1.332. If a later release changes it, adjust the constants in `register.ts`.
