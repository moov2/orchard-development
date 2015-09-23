# Orchard Development

This project is used by Moov2 to assist with developing & deploying solutions utilising [Orchard CMS](http://www.orchardproject.net/).

## Getting Started

The first step is to obtain the source files using the following commands:

    git clone git://github.com/moov2/orchard-development.git example
    rm -rf example/.git

### Prerequisites

In order to work with the project you will need to make sure you have the following tools.

#### NodeJS

[Node.JS](https://nodejs.org/) is used throughout the project to handle automation. [NPM](https://www.npmjs.com/), which is bundled with Node.JS is also heavily used to access third party tools & libraries. Node.JS can be installed by clicking the "Install" link on the [Node.JS homepage](https://nodejs.org/).

#### Grunt

Once Node.JS is installed, [Grunt](http://gruntjs.com/) can be installed running the command below. Grunt is the automated build tool of choice and is used for setup, building & deployment.

`npm install -g grunt`

#### .NET Development Environment

You will need to make sure you're able to develop .NET solutions on your machine. [Visual Studio](https://www.visualstudio.com/) is highly recommended.

#### SQL Server Express

Orchard requires a database to handle storing content and it is highly recommended to use SQL Server Express (other database solutions will still work).

### Running Locally

To get a local version of Orchard running you have to run `setup.cmd`, which will download Orchard source code and setup the custom configuration, modules & themes (this will take a little while so feel free to make a cuppa). Your local version of Orchard will be stored in `local` in a directory that represents the version of Orchard you're running.

Open the `Orchard.sln` file and build the project. Running the project will display the Orchard setup screen which you should complete and you're up and running. In order to complete the Orchard setup you will need to create a database in your local SQL Server instance and add the database connection string to the setup form. Below is an example of a connection string for a database named `example`.

`Data Source=.\SQLEXPRESS;Integrated Security=True;database=example`

You're now running a version of Orchard on your machine, great job!
