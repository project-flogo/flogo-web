# Building and Testing Flogo Web

This document describes how to set up your development environment to build, run and test flogo web.

> Before developing client code please also read the [client code guideline](/docs/client-code-guideline.md)

> Additional developer documentation can be found in [docs](/docs)

* [Prerequisite Software](#prerequisite-software)
* [Getting the Sources](#getting-the-sources)
* [Getting the Images](#getting-the-images)
* [Setting Up the Build Environment](#setting-up-the-build-environment)
* [Running the Application](#running-the-application)
* [Debugging the Application](#debugging-the-application)
* [Running Tests Locally](#running-tests-locally)
* [Advanced Usage](#advanced-usage)
* [Troubleshooting and Known Issues](#troubleshooting-and-known-issues)

## Prerequisite Software
- git
- [Docker and docker-compose](https://www.docker.com) for Mac or Windows or Linux (https://www.docker.com) 1.12.0-rc4-beta20 or later
- For windows you will need basic support for bash scripting, you can use git's bash replacement or any other terminal emulator instead of the dos/window standard command line

- Required only for local mode:
  - GO Lang 1.9 - Follow the instructions here https://golang.org/doc/install
    - Make sure you add $GOPATH/bin to your $PATH variable. Instructions related to the $GOPATH variable are found in the above link in the ["Test your installation" section](https://golang.org/doc/install#testing).
  - [Go dep](https://golang.github.io/dep/)
  - [Node JS 8.9.3](https://nodejs.org/en/download/releases/)
  - [yarn](https://yarnpkg.com) 
  - Install the flogo CLI tool: https://github.com/TIBCOSoftware/flogo-cli

## Getting the Sources

### Make sure you have git access for following repositories:

1. [flogo-web](https://github.com/TIBCOSoftware/flogo-web.git)
1. [flogo-cicd](https://github.com/TIBCOSoftware/flogo-cicd.git)

### Get the Source Code

After you get git access, clone the [flogo-web repository](https://github.com/TIBCOSoftware/flogo-web.git)
and the [flogo-cicd repository](https://github.com/TIBCOSoftware/flogo-cicd.git)

```sh
git clone https://github.com/TIBCOSoftware/flogo-web.git
git clone https://github.com/TIBCOSoftware/flogo-cicd.git
```

## Getting the Images

The development environment depends on flogo services images (flow-service and state-service), if you have access to
TIBCO's reldocker or flogo's private dockerhub you can pull the images from them, otherwise you will need to build the images locally.

Chose and follow **one** of these methods to get the images:

1. Pull from dockerhub
1. Pull from TIBCO reldocker
1. Build the images locally

### Method 1: Pull from dockerhub

In your terminal log into docker hub
```
docker login
```

After you authenticated, pull the images.

Pull the state service image
```sh
docker pull flogo/state-service
```

Pull the flow service image
```sh
docker pull flogo/flow-service
```

### Method 2: Pull from TIBCO reldocker

In your terminal login to reldocker using you LDAP credentials
```sh
docker login reldocker.tibco.com
```

After you authenticated, pull the images:

Pull the state service image
```sh
docker pull reldocker.tibco.com/flogo/state-service:latest
```

Rename the state service image:
```sh
docker tag reldocker.tibco.com/flogo/state-service:latest flogo/state-service:latest 
```

Pull the flow service image
```sh
docker pull reldocker.tibco.com/flogo/flow-service:latest
```

Rename the flow service image:
```sh
docker tag reldocker.tibco.com/flogo/flow-service:latest flogo/flow-service:latest 
```

### Method 3: Build the images locally

Follow the instructions in https://github.com/TIBCOSoftware/flogo-cicd using the private registry method and build *only* the following images (in the specified order, do not use the "build-all.sh" script):

1. flogo/go-builder
1. flogo/state-service
1. flogo/flow-service

Run `docker images` to make sure they were correctly built.

## Setting Up the Build Environment

Open a terminal and run the following command replacing the actual path where you cloned the flogo-web repository. This will tell the start script where to look for the source code.

```sh
export FLOGO_WEB_DEV_ROOT=<path where you cloned flogo-web>
```

Example:
```sh
export FLOGO_WEB_DEV_ROOT=/home/user/projects/flogo-web
```

You can add the export sentence to your profile to avoid manually executing it each time you open a new terminal. 

*TIP:* You can add an alias to your profile for easier flogo start, for example:

```sh
alias fg-dev="bash <path where you cloned flogo-cicd>/docker/flogo-web/dev.sh"
```

That way you will only need to run `fg-dev start local` instead of the long path.


## Running the Application

You can:
- Run flogo-web locally or
- Run flogo-web locally (for windows users)

### Run flogo-web locally

1. `cd` to the directory where you cloned the [flogo-cicd repository](https://github.com/TIBCOSoftware/flogo-cicd.git) or clone it if you haven't already.
1. Run
```sh
./docker/flogo-web/dev.sh start local
```

Application and services will be started, when you see the following banner in the console flogo will be ready to be used in your browser:

```

=============================================================================================
[success] open http://localhost:3303 or http://localhost:3303/_config in your browser
=============================================================================================

```

### Run flogo-web (for windows users)

1. To start services , 'cd' to the directory where you cloned the [flogo-cicd repository](https://github.com/TIBCOSoftware/flogo-cicd.git) or clone it if you haven't already.
1. Run
```sh
./docker/flogo-web/dev.sh start services
```

1. `cd` to the directory where you cloned the [flogo-web repository](https://github.com/TIBCOSoftware/flogo-web.git) or clone it if you haven't already.
1. Run
```
yarn install
yarn start dev-server
```

Application and services will be started, when you see the following banner in the console flogo will be ready to be used in your browser:

```

 ======================================================
                 ___       __   __   __ TM
                |__  |    /  \ / _` /  \
                |    |___ \__/ \__| \__/

   [success] open http://localhost:3303 in your browser
  ======================================================

```

## Debugging the Application

### Debugging the server application

**Note**: Server debugging is not supported in the container/docker run mode.

#### Local debug

In this mode server database will be started and source files will be watched and will be automatically processed when
they change.

However, server application won't be started and it needs to be manually started. This will allow you
to configure your IDE and debugger to suit your needs. 

Replace with your path to flogo-cicd and run:

```sh
FLOGO_WEB_TASK=local-debug <flogo-cicd>/docker/flogo-web/dev.sh start local

``` 

Follow your IDE instructions to configure your debugger to run the file `server.js` that will be generated
 in `<FLOGO_WEB_DEV_ROOT>/dist/server`.
 
Breakpoints can be added directly to the javascript source files in `/src/server` or to the generated files in `dist/server`.


#### Remote debug

Replace with your path to flogo-cicd and run:

```sh
FLOGO_DEBUG=1 <flogo-cicd>/docker/flogo-web/dev.sh start local
```

Server will be started in debug mode and debugger will listen to port 5858. Will also watch for changes
and automatically update.

Follow your IDE instructions to attach your debugger to the port 5858.

Breakpoints can be added directly to the javascript source files in `/src/server` or to the generated files in `dist/server`.


## Running Tests Locally

*TBA*

### Running Client Unit Tests
<!-- TODO: How to build the client app only without starting the application? -->

Start the application. See [Running the Application](#running-the-application) 

Navigate to root project directory

Run:

```sh
npm test:client
```

### Running Server Integration Tests
<!-- TODO: How to build the client app only without starting the application? -->

Build the application and start the database. See [Running the Application](#running-the-application) 

Navigate to the root project directory

```sh
cd <project root>/dist/public 
```

Run:

```sh
npm run test:server
```

*WARNING* Running this test will delete your local database, to avoid these specify where you want the application
to create the temporal test database by passing or setting the `FLOGO_WEB_DBDIR` environment variable.

Example (in linux/mac):

```sh
FLOGO_WEB_DBDIR="/absolute/path/to/some/dir" npm run test:server
```

You can also pass/set the `FLOGO_WEB_LOGLEVEL='error'` environment variable to reduce log verbosity.

## Advanced Usage

The `dev.sh` script used throughout this guide executes roughly the following steps:
 
1. Updates the flogo CLI tool installed in the system by fetching it again via `go get`
1. Starts the flow and state services (required to test-execute a flow when using the UI)
1. Starts the gulp build process. By default it runs the `dev` task

You can chose which gulp task(s) to run by setting the `FLOGO_WEB_TASK` environment variable.
For example, to run the "prod" task execute:

```sh
FLOGO_WEB_TASK=prod /path/to/dev.sh start local
```

If you want to run more than one task you will need to quote them to avoid issues with white spaces. 
For example to run the "dev.build" and "dev.watch" tasks execute:

```sh
FLOGO_WEB_TASK="dev.build dev.watch" /path/to/dev.sh start local
```

To see all available tasks navigate to your <flogo-web> root directory and run:

```sh
yarn gulp help
```

If for some reason you are starting the services manually or don't need to start them, you can skip
using the dev.sh script and directly execute the gulp process by navigating to your <flogo-web> root
and run `yarn start [...your tasks]`.

## Troubleshooting and Known Issues

## Running issues

Try deleting the `dist` folder inside your flogo-web copy and start the application again.

