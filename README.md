# Orchard Development

This project is used by [Moov2](http://moov2.com) to assist with developing & deploying solutions utilising [Orchard CMS](http://www.orchardproject.net/).

## Prerequisites

In order to work with this project you'll need to make sure you have the following tools.

### Grunt

At Moov2, Grunt is our preferred automation tool. It's easy to get started with and extensible with hundreds of [plugins available via NPM](http://gruntjs.com/plugins) and it's straight forward creating your own. In this project Grunt is used to automate obtaining Orchard source files, managing custom modules, themes & configuration and deploying Orchard (with a focus on deploying to Azure).   

In order to install Grunt you'll need to have Node.JS installed to give you access to the node package manager (NPM). The command below will install Grunt globally and make `grunt` available on the command line. This project was developed against Grunt `v0.4.x`.

`npm install -g grunt-cli`

### NodeJS

As mentioned above, Grunt is used heavily in this project therefore Node.JS is required. The version of Grunt this project is using is compatible with stable Node.js versions >= `0.8.0`. To install Node.JS [visit the homepage](https://nodejs.org/), which will display options to install (recommend "Stable").

### Orchard Development Environment

Orchard is built on the ASP.NET MVC platform therefore an environment for developing and running .NET solutions locally is required. In most cases, [Visual Studio](https://www.visualstudio.com/) is the preferred IDE for developing .NET solutions.

## Getting Started

This project acts as a scaffold providing useful shortcuts for developing and deploying with Orchard. The first step is to use the source files of this project as the starting point for your Orchard project. You can either run the commands below in the command line (provided you have [Git](https://git-scm.com/) installed) or [download the project files](https://github.com/moov2/orchard-development/archive/master.zip).

    git clone git://github.com/moov2/orchard-development.git example
    rm -rf example/.git
    
Once the source files are on your machine your project has started and you're in a position to run the setup. The setup will download Orchard source files for the configured version and setup custom modules, themes & overrides. Run the setup by executing `npm install` in the command line, alternatively you can double click `setup.cmd` shortcut. Once the setup has complete, a local version of Orchard can be found in `local/1.9.2` (when configured Orchard version is `1.9.2`).

## Project Structure

Below is a description of the directories & files that come with this project by default. The directory names can be changed from within the `gruntfile.js`, at the top of the file is a `config` object that contains a `paths` object that defines names of directories within the project.

### Deployment

The `deployment` directory contains sub directories that describe the different environments that the project can be deployed to. An `example` of a deployment environment configuration can be found by default, use this as a template when setting up your own environment.

### Modules

When developing on an Orchard project it is common that you'll need to extend the core functionality through the use of modules. These custom modules should be placed within the `modules` directory. Modules inside this directory will be added to the local copy of Orchard when the `grunt setup` command is run.

### Overrides

When developing an Orchard project it is often desirable to overwrite Orchard source files (e.g. providing a custom configuration with `Web.config`). Any files or directories placed inside this folder will be copied over the local Orchard files that are downloaded during `grunt setup`. Ensure that the files match the path relative to the root of the Orchard source. By default, the msdeploy manifest & parameters are overridden to assist with the `grunt deploy` command. Also our preferred `Web.config` for an Orchard project is included and a `robots.txt` that by default prevents robots from visiting the site.

### Themes

Themes define the appearance of an Orchard website and allows you to give a custom look and feel to your site. Any custom themes should be placed within the `themes` directory. Themes inside this directory will be added to the local copy of Orchard when the `grunt setup` command is run.

### config.json

This file defines the configuration for the project. This is where you specify which Orchard version you'd like the project to use, using the `version` property. 

### gruntfile.js

Defines useful tasks used to assist with developing & deploying Orchard. See the [Grunt Tasks](#grunt-tasks) section for more information.

## Grunt Tasks

The crux of this project is the useful grunt tasks to assist with developing & deploying Orchard. The primary tasks that should be run via the command line are listed below.

### Setup

`grunt setup` will download the configured version of Orchard and set up custom modules, themes and overrides. Orchard will only be downloaded if there a directory named with the version number doesn't exist inside the `local` directory. Custom modules & themes have creating symbolic links created between the `modules` & `themes` directory within the project and the `Modules` & `Themes` directory with the downloaded version of Orchard. Modules are also added to the `Orchard.sln` file to ensure the modules appear when the solution is opened using Visual Studio.

When adding new modules or themes into the project, the `grunt setup` task should be run in order to add the module or theme into the locally version of Orchard.

*In order to create the module & theme symbolic links, this command should be run as administrator.

### Build Locally

`grunt build-locally` will build a pre-compiled version of Orchard ready to be distributed. The artifacts for this task will be saved in a directory within the root directory named `dist`.

### Deploy

As described in the [Deploying to Azure](#deploy-to-azure) section, `grunt deploy` will deploy a pre-compiled version of Orchard to a specified environment. This task will fail if the `grunt deploy` command doesn't contain a `-target` parameter that contains the name of a directory within `deployment`.

## Deploying to Azure

One of the primary goals with this project is to make it easier to deploy Orchard to Microsoft Azure. Deployments to Azure are configured in the `deployment` directory, an example of a deployment configuration comes as default. Each environment requires it's own directory within the `deployment` directory, this is important for the Grunt command that triggers a build and deployment to Azure. 

The main configuration file that drives the deployment is `server.json`. Everything that needs to go in this file can be found in the publish profile for your Azure web app. You'll also need to update the `Application Path` parameter in `setparameters.xml` with the name of your web app.

To execute a deployment you'll need to run the `deploy` grunt task and pass the name of the directory inside `deployment` that contains the deployment configuration.

    grunt deploy -target=example
    
As a shortcut, it's recommended that all deployment commands are added to the scripts object inside `package.json`. This allows you to run setup & deployment as one command, `npm run example`. 

### Configuring Azure CDN

If you're hosting Orchard on Azure it's [recommended](http://docs.orchardproject.net/Documentation/Deploying-Orchard-to-Windows-Azure) that blob storage and a CDN handles storing and delivering media (this is a requirement if you're going to have multiple instances). Orchard provides a module that contains a handful of features to assist with hosting on Azure. One of the features handles using Microsoft Azure Blob Storage for storing media instead of the underlying file system. The connection string and CDN endpoint are configured using parameters in `appSettings` inside the `Web.config`. 

Running the deployment task, parameters in `setparameters.xml` are applied by the `msdeploy` command. Two of the parameters handle setting the connection string and CDN endpoint in the `Web.config` that is to be deployed. For the environment you're deploying to you should modify the `setparameters.xml` file (as shown in the example deployment) to set the appropriate values for the properties.

### Configuring Environment

When deploying to a different environment it's often the case that the configuration needs to be modified. This can be done using transforms as shown in the example deployment. Inside the `transforms` directory is an example of a `Web.config` transform that is automatically run during deployment. 