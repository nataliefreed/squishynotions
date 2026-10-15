#!/usr/bin/env bash
# Brings a tool from another git repo into tools/<slug>/ with its full history.
#
#   npm run import -- <repo-url-or-path> <slug> [branch] [folder-inside-that-repo]
#
# Every commit is rewritten so its files live under tools/<slug>/. That way `git log` and
# `git blame` follow the tool's folder, while authors, committers, dates and messages stay
# exactly as they were. The original repo is never touched. Needs bash, git and perl.
#
# Examples:
#   npm run import -- https://github.com/you/spiroweb spirogator master
#   npm run import -- https://github.com/you/tinkerables color-picker main color_picker_from_image
set -euo pipefail

fail() { echo "Error: $*" >&2; exit 1; }

[ $# -ge 2 ] && [ $# -le 4 ] || fail "usage: npm run import -- <repo-url-or-path> <slug> [branch] [folder-inside-that-repo]"
source_repo=$1; slug=$2; branch=${3:-}; folder=${4:-}; folder=${folder%/}

echo "$slug" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$' || fail "the slug can only use lowercase letters, numbers and hyphens"
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
git rev-parse --git-dir >/dev/null 2>&1 || fail "this folder isn't a git repo yet. Run git init and make a first commit."
git rev-parse --verify -q HEAD >/dev/null || fail "make a first commit before importing."
[ -z "$(git status --porcelain)" ] || fail "you have uncommitted changes. Commit or stash them first."
[ ! -e "tools/$slug" ] || fail "tools/$slug already exists."

tmp=$(mktemp -d)
remote="import-$$"
cleanup() { git remote remove "$remote" >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT

echo "Cloning $source_repo ..."
if [ -n "$branch" ]; then git clone -q --branch "$branch" "$source_repo" "$tmp/src"
else git clone -q "$source_repo" "$tmp/src"; branch=$(git -C "$tmp/src" rev-parse --abbrev-ref HEAD); fi
[ -z "$folder" ] || [ -d "$tmp/src/$folder" ] || fail "there's no folder called $folder on branch $branch."
orig_head=$(git -C "$tmp/src" rev-parse HEAD)

git clone -q --no-local --branch "$branch" "$tmp/src" "$tmp/work"

# The rewrite itself: runs once per commit, with that commit's file list on stdin.
cat > "$tmp/filter.sh" <<'EOF'
#!/bin/sh
if [ -z "$FOLDER" ]; then
  git ls-files -s -z | perl -0pe 's/\t/\ttools\/$ENV{SLUG}\//' \
    | GIT_INDEX_FILE="$GIT_INDEX_FILE.new" git update-index -z --index-info
else
  git ls-files -s -z | perl -0ne 'if (m{^(\d+ [0-9a-f]+ \d)\t\Q$ENV{FOLDER}\E/(.*)\z}s) { print "$1\ttools/$ENV{SLUG}/$2" }' \
    | GIT_INDEX_FILE="$GIT_INDEX_FILE.new" git update-index -z --index-info
fi
[ -e "$GIT_INDEX_FILE.new" ] || GIT_INDEX_FILE="$GIT_INDEX_FILE.new" git read-tree --empty
mv "$GIT_INDEX_FILE.new" "$GIT_INDEX_FILE"
EOF

prune=""; [ -z "$folder" ] || prune="--prune-empty"   # drop commits that only touched other folders
echo "Rewriting history under tools/$slug/ ..."
FILTER_BRANCH_SQUELCH_WARNING=1 SLUG="$slug" FOLDER="$folder" \
  git -C "$tmp/work" filter-branch -f $prune --index-filter "sh '$tmp/filter.sh'" -- "$branch" >/dev/null 2>&1 \
  || fail "rewriting the history failed."

# Check that nothing was lost before touching this repo.
meta='%an|%ae|%aI|%cn|%ce|%cI|%s'
git -C "$tmp/src"  log --format="$meta" "$branch" | sort > "$tmp/old.txt"
git -C "$tmp/work" log --format="$meta" "$branch" | sort > "$tmp/new.txt"
if [ -z "$folder" ]; then
  cmp -s "$tmp/old.txt" "$tmp/new.txt" || fail "commit authors, dates or messages changed during the rewrite. Nothing was imported."
else
  [ -z "$(comm -13 "$tmp/old.txt" "$tmp/new.txt")" ] || fail "commit authors, dates or messages changed during the rewrite. Nothing was imported."
fi
strip='BEGIN{FS=OFS="\t"} index($2,p)==1 {print $1, substr($2,length(p)+1)}'
if [ -z "$folder" ]; then want=$(git -C "$tmp/src" ls-tree -r -z "$branch" | tr '\0' '\n')
else want=$(git -C "$tmp/src" ls-tree -r -z "$branch" | tr '\0' '\n' | awk -v p="$folder/" "$strip"); fi
got=$(git -C "$tmp/work" ls-tree -r -z "$branch" | tr '\0' '\n' | awk -v p="tools/$slug/" "$strip")
[ "$want" = "$got" ] || fail "files differ after the rewrite. Nothing was imported."
count=$(wc -l < "$tmp/new.txt" | tr -d ' ')

git remote add "$remote" "$tmp/work"
git fetch -q "$remote" "$branch"
{
  echo "Import tools/$slug from $source_repo with full history"
  echo
  if [ -n "$folder" ]; then echo "Imported the $folder/ folder of branch $branch (original head $orig_head)"
  else echo "Imported branch $branch (original head $orig_head)"; fi
  echo "Commit hashes were rewritten so every file lives under tools/$slug/; authors, dates and messages are unchanged."
} > "$tmp/message.txt"
git merge -q --allow-unrelated-histories --no-ff -F "$tmp/message.txt" FETCH_HEAD

echo
echo "Imported $count commits into tools/$slug/. Authors:"
git log --no-merges --format='%an <%ae>' -- "tools/$slug" | sort | uniq -c | sort -rn | sed 's/^/  /'
echo
echo "Next: add tools/$slug/tool.json (title, description, tags), then run npm start."
