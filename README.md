# Chrysalis App Store

The list of apps shown in the **Store** in [Chrysalis](https://github.com/ProjectChrysalis/Chrysalis-Engine).
Chrysalis reads [`apps.json`](apps.json) from this repository, so an app added
here shows up for everyone, and people who have Chrysalis open see it marked
as new.

## Official and community apps

- **Official** apps live under the [ProjectChrysalis](https://github.com/ProjectChrysalis)
  organization and are maintained by the Chrysalis team. Their repositories end
  in `-Chrysalis` (for example
  [Roleplay-Chrysalis](https://github.com/ProjectChrysalis/Roleplay-Chrysalis)),
  so the official apps are easy to find.
- **Community** apps are everything else. They are made by other people and
  run real code on the Chrysalis server they are installed on, so Chrysalis
  shows what each one's plugins can do before it installs.

Official status comes from where an app's repository lives, not from this
list: nothing in an entry can make an app official.

Service apps currently require the Chrysalis staging build.

Some apps are **service apps** (`"kind": "service"` in their `manifest.json`):
they start their own program on the computer running Chrysalis, outside the
sandbox. Chrysalis marks them as such, and an admin approves the exact program
before it first starts.

## Add your app

1. Make sure your app works with **Import app** in the Chrysalis launcher. The
   repository must be public and have `manifest.json` at its root.
2. Fork this repository and add an entry at the end of `apps.json`:

   ```json
   {
     "id": "my-app",
     "name": "My App",
     "description": "What it does, in a sentence or two.",
     "author": "Your name",
     "repository": "https://github.com/you/my-app",
     "tags": ["notes"],
     "added": "2026-09-13"
   }
   ```

3. Run `bun scripts/validate.ts --clone` and open a pull request.

| Field | Rules |
| --- | --- |
| `id` | Unique. Lowercase letters, digits, `-` and `_`, up to 64 characters. |
| `name` | Up to 80 characters. |
| `description` | Up to 500 characters. |
| `author` | Up to 80 characters. |
| `repository` | The `https://` address of a public git repository. |
| `ref` | Optional. A branch or tag to install instead of the default branch. |
| `tags` | Optional. Up to 8 lowercase tags. |
| `added` | The day the entry is added, `YYYY-MM-DD`. It decides what counts as new. |

Updates need no pull request here: Chrysalis offers each installed app's
updates straight from its own repository.

## Removing an app

Open an issue or a pull request that removes the entry. Apps that break,
disappear, or turn out to be harmful are taken off the list. Removing an entry
does not uninstall the app from anyone's Chrysalis.

## Using another list

A Chrysalis server can use a different list, or none, with `apps.store` in its
`config.yaml`.
