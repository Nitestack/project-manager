# Project Manager CLI

Project Manager is a command-line interface (CLI) tool designed to streamline project management, allowing you to swiftly navigate between different projects.

## Installation (using pnpm)

### Clone the repository

```bash
git clone https://github.com/nitestack/project-manager --depth 1
```

### Install dependencies

```bash
cd project-manager
pnpm install
```

### Add the CLI globally

```bash
pnpm link --global
```

I have opted not to publish this tool on the npm registry. Given its nature as a compact CLI tool, I have decided to spare users and myself from the intricacies associated with npm publishing.

## Usage

To get started, run the following command:

```bash
pm --help
```

This command triggers an interactive setup guide to help configure the project manager according to your preferences.

For assistance and information about the CLI, run the following command:

```bash
pm --help
```

Wishing you seamless project management!
