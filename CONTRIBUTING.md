# Contributing

Thanks for helping improve Elementary Audio Kit.

## Commit and PR titles

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles:

```text
<type>(optional-scope): <description>
```

Examples:

```text
feat(ui): add styled audio knob
fix(timing): correct beat counter reset
docs: document release flow
refactor(sequencing): simplify pattern parsing
```

Common types:

- `feat`: user-facing feature or public API addition
- `fix`: bug fix
- `docs`: documentation-only change
- `test`: tests-only change
- `refactor`: code change that preserves behavior
- `chore`: maintenance work
- `build`: build or packaging change
- `ci`: CI change

If the change is breaking, mark it explicitly:

```text
feat(ui)!: rename PianoKeys props
```

or include a footer:

```text
BREAKING CHANGE: PianoKeys no longer accepts ...
```

If this repo uses squash merging, the PR title becomes the final commit title, so format the PR title as a Conventional Commit too.

## Release impact

Conventional Commits make it easier to choose the next semver bump and can support automated release notes later:

- `fix:` → patch release
- `feat:` → minor release
- `!` or `BREAKING CHANGE:` → major release
- `docs:`, `test:`, `refactor:`, `chore:` → usually no public release bump unless they affect the published package

Guidelines alone do not generate releases; they keep the history structured so npm-native releases are easier now and release tooling can be added later if needed.

## Before opening a PR

Run the relevant checks:

```bash
npm test -- --run
npm run build
```

If the change affects package contents, also inspect the package preview:

```bash
npm pack --dry-run
```
