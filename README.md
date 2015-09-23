# Orchard Development

This project is used by Moov2 to assist with developing & deploying solutions utilising [Orchard CMS](http://www.orchardproject.net/).

## Getting Started

The first step is to obtain the source files using the following commands:

    git clone git://github.com/moov2/dotnet-mvc-boilerplate.git myproject
    rm -rf myproject/.git

### Prerequisites

In order to work with the project you will need to make sure you have the following tools.

#### NodeJS

[Node.JS](https://nodejs.org/) is used throughout the project to handle automation. [NPM](https://www.npmjs.com/), which is bundled with Node.JS is also heavily used to access third party tools & libraries. Node.JS can be installed by clicking the "Install" link on the [Node.JS homepage](https://nodejs.org/).

#### Grunt

Once Node.JS is installed, [Grunt](http://gruntjs.com/) can be installed running the command below. Grunt is the automated build tool of choice and is used for setup, building & deployment.

`npm install -g grunt`
