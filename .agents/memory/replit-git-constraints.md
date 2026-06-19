---
name: Replit main-agent git constraints
description: What git operations are blocked for the main agent and how to work around them
---

# Git constraints for the main agent (Replit env)

- **`git rm` and other destructive git commands are blocked** for the main agent
  (must be delegated to a background Project Task).
- **The platform restores tracked files that are deleted from the filesystem.**
  Deleting a git-tracked file via `rm` is futile — it reappears at the next
  checkpoint. However, **modifications** to tracked files persist, and **new
  (untracked) files persist** and get committed by the checkpoint.
  - Corollary: to "remove" a problematic tracked file you usually can't; instead
    fix its *content* (e.g. regenerate a lockfile in-sync rather than deleting it).
- **Recovering files from history without `git checkout`:** `git checkout <ref> -- <path>`
  is destructive/blocked. Use read-only `git show <ref>:<path> > <path>` instead to
  restore file content from any commit.
- Read-only git is allowed but **must pass `--no-optional-locks`** (e.g.
  `git --no-optional-locks status`); plain `git status` is sandbox-blocked.
