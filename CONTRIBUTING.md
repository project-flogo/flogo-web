# Contributing

Thank you for your interest in contributing to Flogo Web. We've prepared the following guide to get you started.

## Things to Know Before Start Contributing

### About the architecture

Most of the code is written using Typescript, the [official Typescript documentation](https://www.typescriptlang.org/docs/home.html)
is a good resource to learn about it.

The Flogo Web UI follows a regular client-server model and as such it is divided into two principal components: the server and the client.

The server application (located under [`/apps/server`](/apps/server)) is a NodeJs application.
Besides persisting data, the server application wraps the [Flogo CLI](https://github.com/project-flogo/cli)
to interact with an underlying Flogo engine project and exposes its functionality to the client application.

The client application (located under [`/apps/client`](/apps/client)) is implemented using the [Angular](https://angular.io/) framework
and provides a browser based UI to design Flogo applications.

Communication between server and client is mostly done through a REST API exposed by the server.

You can find more information in the [application docs](/docs) like an explanation of the
[directory structure](./libs/). Also there's more information in the README file of the server and client apps.

## Submitting a Pull Request (PR)

Before submitting a PR please make sure that:

1. You've forked the repository and created a branch which is up to date with the main repository's `master` branch
1. Your commit messages follows our [commit conventions](#commit-conventions)
1. If you've changed code in `libs/lib-client` make sure the e2e test pass: run `yarn e2e demo-libs-e2e`
1. You've added tests for bug fixes or new features that need to be tested
1. All test suites pass: run `yarn test`
1. Server code builds without errors: run `yarn build server`
1. Client code builds without errors: run `yarn build client`
1. Code follows the format convention: run `yarn format:write` (More info in the [Code Formatting](#code-formatting) section)
1. Code lints: run `yarn lint`

## Development Workflow

Instructions for setting up the development environment are detailed in the [development section](/README.md#development)
of the project README.

These are some commands that will be useful for your development workflow:

- `yarn` or `yarn install` to make sure your dependencies are up to date
- `yarn start server` start the server app in development mode
- `yarn start client` start the client app in development mode
- `yarn format:check` to validate all code is formatted
- `yarn format:write` to format all the code
- `yarn lint` to lint all packages
- `yarn lint <package-name>` to lint a specific package. For example `yarn lint plugins-flow-client`
- `yarn test` to run all unit tests in all packages
- `yarn test <package-name>` to run all unit tests in a specific package. For example `yarn test plugins-flow-client`
- `yarn build server` to build the server app (will output to `dist/apps/server`)
- `yarn build client` to build the client app (will output to `dist/apps/client`)

> :info: We're using [Nx - Extensible Dev Tools for Monorepos](https://nrwl.io/nx/overview) for most our tasks/commands. Nx provides options to the previous commands that can enable more advanced workflows, check out their [documentation](https://nx.dev/angular/api/home) for more information.

## Style guide and code conventions

### Code formatting

Flogo Web uses [Prettier](https://prettier.io/) for code formatting which will automatically format javascript, typescript, css, html and markdown files.

The easiest way to format your code is directly in your code editor, refer to [Prettier's documentation for Editor Integration](https://prettier.io/docs/en/editors.html) for
an explanation of how to set them up.

Alternatively you can run the `format` script which will format, to all files in the project:

```bash
yarn format:write
```

### Commit conventions

We try to follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0) and plan to introduce automation tools on top of
it in the future. Please read the [Quick Summary](https://www.conventionalcommits.org/en/v1.0.0/#summary) of the specification.

From the specification a commit message should be structured as follows:

```
<type>[(optional scope)]: <description>
<BLANK LINE>
[optional body]
<BLANK LINE>
[optional footer(s)]
```

The footer should reference any GitHub issues that the commit closes. Check out the [Github docs](https://help.github.com/en/articles/closing-issues-using-keywords)
about closing issues using keywords

#### Type

Must be one of the following:

- **fix:** a bug fix
- **feat:** a new feature
- **docs:** documentation related changes
- **style:** changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor:** no functional changes, no api changes
- **test:** adding missing tests or correcting existing tests
- **build:** changes that affect the build system
- **revert:** for revert commits
- **chore:** Other changes that don't modify src or test files

#### Scope

Optional commit scope should reflect our libraries/packages. This is a list of our current scopes:

- **client**
- **server**
- **core**
- **lib-client**
- **lib-server**
- **parser**
- **flow-server**
- **flow-client**
- **flow-core**
- **stream-server**
- **stream-client**
- **stream-core**
- **docs**

## Other tasks

All the commands listed in the following subsections are specified as `<command>: description` and they can be run from
the root of the project as:

```sh
yarn run <command>
```

### Managing engine/local data

- `clean:local`: Clean ALL your local data. This will remove the engine, database and logs.
- `clean:engines`: Remove the local engines only. This will force the server to rebuild the engine on next startup.

### Misc

- `update-global-flogo`: Update global flogo-cli to the latest available

Flogo Web uses npm/yarn scripts for its build process. Take a look at README.md of the packages as well as at the scripts section
in the `package.json` of the root project and the subpackages to find other commands available.

## Server Environment

There are a couple of environment variables you can use to control the server behavior dynamically, they're document in the [`.env.example`](./.env.example) file.

To use them make a copy and rename the [`.env.example`](/.env.example) to `.env` and then uncomment, add or modify
the environment variables defined in created `.env` file.

You can alternatively set regular environment variables the way your OS supports them.
