# Desktop wallpaper adaptation

[GroundSurf](https://github.com/takingbreath/GroundSurf) is an optional, MIT-licensed desktop adaptation of shan-shui-inf by **Akhilesh Khajuria**. The original artwork generator is by **Lingdong Huang**; its MIT license and attribution are retained in the app and source.

GroundSurf provides standalone macOS and Windows apps that display the generated scenery behind ordinary windows and desktop icons. It generates new scenery as the view moves forward, discards old data behind the view, and works offline after installation. The apps provide pause/resume, scrolling speeds, new landscapes, and quit controls. Quitting reveals the user's existing wallpaper.

The apps and their platform-specific support are maintained in the [GroundSurf repository](https://github.com/takingbreath/GroundSurf). The browser generator remains usable directly from this repository.

## macOS

Requires macOS 13 or later. The universal binary includes Apple Silicon and Intel; Apple Silicon has been tested, while Intel hardware testing remains outstanding.

- [Mac release and downloads](https://github.com/takingbreath/GroundSurf/releases/tag/v1.3.0)
- [Universal DMG](https://github.com/takingbreath/GroundSurf/releases/download/v1.3.0/GroundSurf-1.3.0-universal.dmg): open it and drag GroundSurf into Applications.

Alternatively, install to `~/Applications` from Terminal:

```sh
curl -fsSL https://github.com/takingbreath/GroundSurf/releases/download/v1.3.0/install.sh | bash
```

Or, with Homebrew already installed:

```sh
brew tap takingbreath/groundsurf
brew install --cask takingbreath/groundsurf/groundsurf
```

The Homebrew package is in a third-party tap. The Mac preview is ad-hoc signed and is **not Developer ID signed or Apple notarized**. macOS may block its first launch. Review [Apple's guidance](https://support.apple.com/en-us/102445) and the [installer source](https://github.com/takingbreath/GroundSurf/blob/main/install.sh) before deciding whether to run it.

## Windows

Windows 11 x64 is the primary target; Windows 10 build 19041+ is targeted but needs broader validation. Windows on Arm is not yet a supported/tested target. The app uses .NET Framework 4.8 and Microsoft's shared WebView2 Runtime, normally already included on Windows 11. Setup checks for WebView2 and directs users to Microsoft's official runtime download if it is missing. Lively Wallpaper is not required.

- [Windows release and downloads](https://github.com/takingbreath/GroundSurf/releases/tag/windows-v0.1.0)
- [Per-user installer](https://github.com/takingbreath/GroundSurf/releases/download/windows-v0.1.0/GroundSurf-Windows-0.1.0-Setup-x64.exe)
- [Portable ZIP](https://github.com/takingbreath/GroundSurf/releases/download/windows-v0.1.0/GroundSurf-Windows-0.1.0-Portable-x64.zip): extract it and run GroundSurf.exe, keeping its accompanying files together.

For one-line installation, open **PowerShell** in Windows Terminal:

```powershell
irm https://takingbreath.github.io/GroundSurf/install.ps1 | iex
```

The [installer script](https://github.com/takingbreath/GroundSurf/blob/main/docs/install.ps1) verifies a pinned SHA-256, retains Windows's internet-origin marker, installs for the current user, and opens the Start menu shortcut. Administrator privileges are not required. Creating a desktop shortcut and starting with Windows are optional, off by default.

The Windows preview is **not Authenticode signed** and may show an unknown-publisher or SmartScreen warning. Organization policies may block unsigned apps. Review the source before running downloaded scripts. The installer does not change execution policy or Windows security settings.

## Reusing the adaptations

The implementation is public and can be studied or reused under its included licenses:

| Component | Source | What it adds |
|---|---|---|
| Adapted generator | [generator.js](https://github.com/takingbreath/GroundSurf/blob/main/Sources/generator.js) | Equivalent noise/sample optimizations and a numeric drawing-command backend that preserves the original coordinate rounding and painter order |
| Shared painter | [painter.js](https://github.com/takingbreath/GroundSurf/blob/main/Sources/painter.js) | Full-detail canvas painting, text/circle support, and paper tint/compositing |
| Background worker | [worker.js](https://github.com/takingbreath/GroundSurf/blob/main/Sources/worker.js) | Generation, full-bounds visibility/retention, placement-data cleanup, worker painting where supported, and a command fallback |
| Scrolling viewer | [viewer.js](https://github.com/takingbreath/GroundSurf/blob/main/Sources/viewer.js) | One frame prepared ahead, scrolling between boundaries, transactional frame replacement, and failure recovery |
| Offline assembly | [assemble.py](https://github.com/takingbreath/GroundSurf/blob/main/Sources/assemble.py) | Embeds the worker, generator, painter, and viewer into a single HTML resource |
| macOS host | [main.swift](https://github.com/takingbreath/GroundSurf/blob/main/Sources/main.swift) | Desktop windows, menu-bar controls, per-display views, a native animation clock, and separate pause/sleep reasons |
| Windows host | [Windows sources and notes](https://github.com/takingbreath/GroundSurf/tree/main/Windows) | Tray controls, WebView2 hosting, Explorer desktop attachment, persisted preferences, and pause/startup rules |
| Regression checks | [tests](https://github.com/takingbreath/GroundSurf/tree/main/tests) | Fixed-seed output/command comparisons, bounded-scrolling checks, and Windows installer checks |

The adapted generator and renderer form a coordinated pipeline; these files are not a drop-in replacement for the original `index.html`. For another host, use the assembled resource with the native clock interface (`window.wallpaper.tick()`, `pause(...)`, and `speed(...)`), or add a browser animation driver appropriate to that host. Plainly opening the native-host resource in a browser does not supply its animation clock or make it a desktop wallpaper.

To rebuild the apps, follow the [GroundSurf build instructions](https://github.com/takingbreath/GroundSurf#build) and [Windows implementation notes](https://github.com/takingbreath/GroundSurf/blob/main/Windows/README.md). Native packaging is platform-specific; the artwork engine is shared.

## Quality, performance, and remaining limits

Three fixed-seed full-scene SVG comparisons matched the original generated output. A native WebKit comparison matched a tested frame pixel-for-pixel in both worker and fallback painting paths. A simulated 100-section run checked retained geometry and placement data. Windows CI executed the renderer, verified generation/scrolling in a desktop-attached view, checked pause and overlapping sleep-state logic, and exercised setup/uninstall. See the [validation evidence](https://github.com/takingbreath/GroundSurf/blob/main/docs/GroundSurf-validation.json) and [Windows release checks](https://github.com/takingbreath/GroundSurf/releases/download/windows-v0.1.0/windows-validation.json).

Preparing ahead adds bounded image memory. A small app download does not establish low total RAM, and generator-only timing improvements do not establish total CPU or battery savings. There is no overnight memory or battery claim. Multi-monitor/DPI behavior, actual sleep/wake and Explorer/Spaces transitions, and older/other hardware need broader testing. Windows desktop attachment uses Explorer's window hierarchy and may require compatibility updates as the shell evolves.

For issues concerning the apps, installers, or platform integration, use [GroundSurf's issue tracker](https://github.com/takingbreath/GroundSurf/issues). For changes to the original artwork generator, contribute to shan-shui-inf.
