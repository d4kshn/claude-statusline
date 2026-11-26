#!/usr/bin/env bash
# Claude Code status line.
# Format: Model effort · ~/dir · 5h: YY% (H:MM hrs) · 7d: YY% (Day HH:MM) · ctx: YY% left

input=$(cat)

SEP=' · '
GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; RESET=$'\033[0m'

# Color a remaining percentage: >50 green, 20-50 yellow, <20 red.
color_pct() {
  local p=$1 c
  if   (( p > 50 )); then c=$GREEN
  elif (( p >= 20 )); then c=$YELLOW
  else c=$RED
  fi
  printf '%s%d%%%s' "$c" "$p" "$RESET"
}

# Format epoch seconds: BSD date (macOS) takes -r, GNU date (Linux, Git Bash) takes -d @.
fmt_epoch() { date -r "$1" "$2" 2>/dev/null || date -d "@$1" "$2"; }

IFS=$'\x1f' read -r model effort dir h5_used h5_reset d7_used d7_reset ctx_left < <(
  jq -r '[
    .model.display_name // "",
    .effort.level // "",
    .workspace.current_dir // .cwd // "",
    .rate_limits.five_hour.used_percentage // "",
    .rate_limits.five_hour.resets_at // "",
    .rate_limits.seven_day.used_percentage // "",
    .rate_limits.seven_day.resets_at // "",
    .context_window.remaining_percentage // ""
  ] | map(tostring) | join("\u001f")' <<<"$input"
)

# Model + effort
out="$model"
[[ -n $effort ]] && out+=" $effort"

# Directory with ~ for the home folder. On Windows (Git Bash) the path arrives
# as C:\Users\me\..., so compare it with slashes against the Windows form of $HOME.
dir=${dir//\\//}
home=$HOME
command -v cygpath >/dev/null 2>&1 && home=$(cygpath -m "$HOME")
if [[ $dir == "$HOME" || $dir == "$HOME"/* ]]; then
  dir="~${dir:${#HOME}}"
else
  shopt -s nocasematch   # Windows paths ignore case (c:/users vs C:/Users)
  [[ $dir == "$home" || $dir == "$home"/* ]] && dir="~${dir:${#home}}"
  shopt -u nocasematch
fi
out+="${SEP}${dir}"

# 5-hour window: remaining % and time until reset
if [[ -n $h5_used && -n $h5_reset ]]; then
  left=$(( 100 - $(printf '%.0f' "$h5_used") ))
  secs=$(( ${h5_reset%.*} - $(date +%s) )); (( secs < 0 )) && secs=0
  out+="${SEP}5h: $(color_pct "$left") ($(( secs / 3600 )):$(printf '%02d' $(( secs % 3600 / 60 ))) hrs)"
else
  out+="${SEP}5h: --"
fi

# 7-day window: remaining % and local reset day/time
if [[ -n $d7_used && -n $d7_reset ]]; then
  left=$(( 100 - $(printf '%.0f' "$d7_used") ))
  out+="${SEP}7d: $(color_pct "$left") ($(fmt_epoch "${d7_reset%.*}" '+%a %H:%M'))"
else
  out+="${SEP}7d: --"
fi

# Context window
if [[ -n $ctx_left ]]; then
  out+="${SEP}ctx: $(color_pct "$(printf '%.0f' "$ctx_left")") left"
else
  out+="${SEP}ctx: --"
fi

printf '%s\n' "$out"
