# Datapipeline lib

Table of Contents
=================

* [Introduction](#introduction)
  * [API](#api)
* [Using this Library](#using-this-library)
  * [Overview](#overview)
    * [Examples](#examples)
      * [Event Publisher](#event-publisher)
      * [Event Subscriber](#event-subscriber)
      * [Event Projector](#event-projector)
      * [Building examples](#building-examples)
        * [Other notes:](#other-notes)
* [Library Development](#library-development)
  * [Requirements](#requirements)
  * [Setup](#setup)
  * [Generate Documentation](#generate-documentation)
  * [Publish to private repo](#publish-to-private-repo)
  * [Remove unused Docker containers and images](#remove-unused-docker-containers-and-images)
    * [Stop all containers](#stop-all-containers)
    * [Delete all containers](#delete-all-containers)
    * [Remove all images](#remove-all-images)

# Introduction
This library contains the building blocks of all DataPipeline apps.  It standardizes usage of Kafka to a PubSub model for ease of comprehension.  It standardizes Reducers for usage in Projectors.  It also provides serialization/deserialization capabilities for event handling.

## API
The API documents can be viewed at [API Docs](/docs/index.html)
# Using this Library

## Overview
This is a typescript based library that can be utilized by a node application to perform data pipeline tasks with Kafka. It consists of three usecases:
1. Event Publisher
2. Event Subscriber
3. Projector

### Examples

#### Event Publisher
The Event Publisher is a process that will create a Kafka Producer, supply a function that can be used to transform an event object (with name & data key/value pairs) into a named event type that can be placed onto Kafka, and then actually publish these new events onto the specified topic within Kafka.

See `examples/eventPublisher.ts`

#### Event Subscriber
The Event Subscriber is a process that will subscribe to a Kafka topic and receive events.

See `examples/eventSubscriber.ts`

#### Event Projector
The Event Projector is a process that will subscribe to a kafka topic, take the previous state of a reduced data object apply the change as specified by the event; and finally publish a new reduced data object onto a log-compacted Kafka Topic.

See `examples/eventProjector.ts`

#### Building examples
Type `gulp build-examples` to build runnable versions of the examples.  Then type `node <file>.js` with the docker-compose components running to see the output.

##### Other notes:
This library utilizes [Highland.JS](http://highlandjs.org/) streams in order to:
* Manage both synchronous and asynchronous code, easily;
* Utilize Node.js streams to provide consistent functionality regardless of the type of stream
* Provide laziness & back-pressure


# Library Development
## Requirements

 - node.js v8.4.0 (for an easy way to get specific versions use [nvm](https://github.com/creationix/nvm))
 - [yarn](https://yarnpkg.com/en/)
 - [docker compose](https://docs.docker.com/compose/install/)
 - [npx](https://www.npmjs.com/package/npx)
 
## Setup
**Before you start ensure you have configured your access to the private NPM registry, if not, contact dan.belwood@salesforce.com to setup an account.**

To setup your private NPM registry access, type:
```bash
npm config set registry https://npm-proxy.fury.io/TEAM-USERNAME/
yarn install
```

Copy the following into a file called `.env`:
```
PORT=8080
NODE_ENV=development
WITH_SASL=0
```

Launch the app image:

```bash
docker-compose up
```

This command will run four docker services:
 1. Kafka
 2. Zookeeper
 3. Kafka Admin
 4. "Dev" Service that will begin a container that has a process that will watch for changes and then:
    - Clean the build directory
    - Compile the TypeScript
    - Run the tests
    - Display the output

In some cases, mostly during development there is a need to modify the library locally and let the consuming local application
use it without publishing to GemFury. To do so you can use `link`
feature of [yarn](https://yarnpkg.com/lang/en/docs/cli/link/):

- Run `yarn link` in the datapipeline-lib folder
- Run `yarn link datapipeline-lib` in the consuming(client) application

## Generate Documentation

- Run `gulp docs`

This will generate / update the [API Docs](/docs/index.html)

## Publish to private repo

The private repo is [Gemfury Asset Registry](https://manage.fury.io).

- Bump the version before pushing your branch:

```bash
$ yarn version 
```

- Edit the `~/.npmrc` file so it looks like this (should have just one line):
`//npm-proxy.fury.io/:_authToken=<your auth token>`

- Set the npm config registry environment variable: 

```bash
$ export NPM_CONFIG_REGISTRY=https://npm-proxy.fury.io/TEAM-USERNAME/
```

- Set the yarn config registry: 

```bash
$ yarn config set registry https://npm-proxy.fury.io/TEAM-USERNAME/
```

- After the branch has been merged to master, checkout the master branch locally and pull the latest source.
- Publish:

```bash
$ yarn publish 
enter same version number as with yarn version
```
Confirm package has been published in [Gemfury Asset Registry](https://manage.fury.io).
    
## Remove unused Docker containers and images

### Stop all containers

`docker ps -q -a | xargs docker stop`

### Delete all containers

`docker ps -q -a | xargs docker rm`

### Remove all images

Another way of removing all images is:

`docker images -q | xargs docker rmi`

If images have depended children, forced removal is via the -f flag:

`docker images -q | xargs docker rmi -f`


