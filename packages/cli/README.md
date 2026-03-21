# Foldaa CLI

The Foldaa Command Line Interface (CLI) allows you to orchestrate the Foldaa platform directly from your favorite terminal (Warp, iTerm2, Terminal.app, etc.).

## Installation

To use the `foldaa` command globally on your system:

1.  **Navigate to the CLI package**:
    ```bash
    cd packages/cli
    ```

2.  **Install dependencies and build**:
    ```bash
    npm install
    npm run build
    ```

3.  **Link the command**:
    ```bash
    npm link
    ```

Now you can run the `foldaa` command from anywhere!

## Usage

### Deploying a new project
You can deploy any website directly by providing its URL. The CLI will automatically detect the framework, extract assets, and create a Cloudflare-backed project.

```bash
foldaa https://arpal.framer.website --pwa
```

### Listing your projects
```bash
foldaa list
```

### Managing domains
```bash
foldaa domain verify example.com
```

## Features
- **Auto-detection**: Smartly identifies frameworks (React, Vue, Next.js, etc.).
- **Asset Extraction**: Automatically pulls icons, manifest data, and theme colors.
- **PWA Ready**: Use the `--pwa` flag to generate a manifest and service worker.
- **Warp-friendly**: Designed to work seamlessly with modern terminals like Warp.
