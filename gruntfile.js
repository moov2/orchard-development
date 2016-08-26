var path = require('path');

module.exports = function(grunt) {

        /**
         * Read configuration file.
         */
    var config = grunt.file.readJSON('./config.json'),

        /**
         * Contain credentials for deployment.
         */
        deployment;

    /**
     * Defines all the different directory paths to files manipulated by the grunt
     * tasks.
     */
    config.paths = {
        overrides: './overrides',
        themes: './themes',
        modules: './modules',
        deployment: './deployment',

        // msdeploy doesn't function unless this is an absolute path.
        dist: path.resolve('./dist'),

        // path to directory that contains Orchard.
        orchardDirectory: path.join('./local', config.orchardVersion),

        // path to Orchard project file.
        orchardProjectFile: path.join('./local', config.orchardVersion, 'Orchard.proj'),

        // path to artifacts created by Orchard build tasks.
        orchardBuildArtifacts: path.join('./local', config.orchardVersion, 'build/Precompiled'),

        // path to files included in MsDeploy package in order to deploy Orchard.
        orchardMsDeployFiles: path.join('./local', config.orchardVersion, 'lib/msdeploy'),
        
        // path to ClickToBuild.cmd file.
        orchardClickToBuild: 'ClickToBuild.cmd'
    };
    
    config.excludeModules = config.excludeModules || [];

    /**
     * loads a configuration file for the server environment that is about to
     * be deployed to.
     */
    if (grunt.option('target')) {
        deployment = {
            transformFile: path.join(config.paths.deployment, grunt.option('target'), 'transforms/Web.Transform.config'),
            overrides: path.join(config.paths.deployment, grunt.option('target'), 'overrides'),
            target: grunt.option('target'),
            applicationName: grunt.option('applicationName'),
            computerName: grunt.option('computerName'),
            username: grunt.option('username'),
            password: grunt.option('password')
        };
    }
    
    /**
     * Loads all grunt tasks.
     */
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        /**
         * ------
         * Configuration properties.
         * ------
         */

        // configuration values used to drive the build tasks.
        config: config,

        // configuration for deployment.
        deployment: deployment,

        /**
         * -----
         * Build tasks.
         * -----
         */

        /**
         * Deleting stuff.
         */
        clean: {
            /**
             * Removes artifacts from previous build.
             */
            artifacts: ['<%= config.paths.dist %>'],
            
            /**
             * Tidies up deployment artefacts.
             */
            tidy: ['<%= config.paths.dist %>/setparameters.xml']
        },

        /**
         * Compressing build artifacts ready for deployment.
         */
        compress: {
            /**
             * Adds build artifacts and Orchard MsDeploy files into a package ready
             * to be deployed using MsDeploy.
             */
            dist: {
                options: {
                    archive: '<%= config.paths.dist %>/Orchard.zip'
                },
                files: [
                    { expand: true, cwd: '<%= config.paths.orchardMsDeployFiles %>', src: ['**'], dest: '', filter: 'isFile' },
                    { expand: true, cwd: '<%= config.paths.orchardBuildArtifacts %>', src: ['**'], dest: 'Orchard/' }
                ]
            }
        },

        /**
         * Copying files.
         */
        copy: {
            /**
             * Copies build artifacts into the distributable directory.
             */
            build: {
                files: [
                    { expand: true, cwd: '<%= config.paths.orchardBuildArtifacts %>', src: ['**'], dest: '<%= config.paths.dist %>' }
                ]
            },

            /**
             * Copies the override files into the local copy of orchard.
             */
            overrides: {
                files: [
                    { expand: true, cwd: '<%= config.paths.overrides %>', src: ['**'], dest: '<%= config.paths.orchardDirectory %>' }
                ]
            },

            /**
             * Copies override files in the web project root directory in the local
             * version of Orchard's web project.
             */
            configBuild: {
                files: [
                    { expand: true, cwd: '<%= config.paths.overrides %>/src/Orchard.Web', src: ['**', '!Web.config', '!**/*.cs'], dest: '<%= config.paths.orchardBuildArtifacts %>' }
                ]
            },

            /**
             * Copies environment specific overrides, e.g. robots.txt, over files
             * about to be deployed.
             */
            overridesEnvironment: {
                files: [
                    { expand: true, cwd: '<%= deployment.overrides %>', src: ['**'], dest: '<%= config.paths.orchardBuildArtifacts %>' }
                ]
            }
        },

        /**
         * Builds a version of Orchard ready for deployment.
         */
        msbuild: {
            orchard: {
                src: ['<%= config.paths.orchardProjectFile %>'],
                options: {
                    targets: ['Precompiled'],
                    verbosity: 'minimal'
                }
            }
        },
        
        /**
         * Run ClickToBuild.cmd in order to get NuGET references.
         */
        shell: {
            clickToBuild: {
                command: 'cmd.exe /C <%= config.paths.orchardClickToBuild %> < nul',
                options: {
                    execOptions: {
                        cwd: '<%= config.paths.orchardDirectory %>',
                        maxBuffer: Infinity
                    }
                }
            }
        },

        /**
         * Executes the themes independant build scripts.
         */
        buildThemes: {
            options: {
                dest: '<%= config.paths.orchardBuildArtifacts %>',
                themes: '<%= config.paths.themes %>'
            }
        },

        /**
         * -----
         * Deploy tasks.
         * -----
         */

        /**
         * Environment specific config transformation
         */
        xdt: {
            environment: {
                src: '<%= config.paths.orchardBuildArtifacts %>/Web.config',
                dest: '<%= config.paths.orchardBuildArtifacts %>/Web.config',
                options: {
                    transform: '<%= deployment.transformFile %>'
                }
            }
        },

        /**
         * Deploys build artifacts to Azure.
         */
        msdeploy: {
            orchard: {
                options: {
                    verb: 'sync',
                    allowUntrusted: 'true',
                    source: { package: '<%= config.paths.dist %>/Orchard.zip' },
                    dest: "auto,ComputerName='<%= deployment.computerName %>',UserName='<%= deployment.username %>',Password='<%= deployment.password %>',AuthType='Basic',includeAcls='False'",
                    disableLink: ['AppPoolExtension','ContentExtension','CertificateExtension'],
                    skip: 'Directory=App_Data',
                    setParamFile: '<%= config.paths.dist %>/setparameters.xml'
                }
            }
        },
        
        /**
         * Replaces parameters in the msdeploy parameter file with arguments
         * passed to grunt task. 
         */
        'string-replace': {
            msdeployParamFile: {
                files: {
                    '<%= config.paths.dist %>/setparameters.xml': '<%= config.paths.deployment %>/setparameters.xml',
                },
                options: {
                    replacements: [{
                        pattern: '@@applicationName',
                        replacement: '<%= deployment.applicationName %>'
                    }]
                }
            }
        },

        /**
         * -----
         * Setup tasks.
         * -----
         */

        /**
         * Adds modules to the Orchard solution.
         */
        addModulesToOrchard: {
            options: {
                orchard: '<%= config.paths.orchardDirectory %>',
                modules: '<%= config.paths.modules %>'
            }
        },
        
        /**
         * Removes modules from the Orchard solution.
         */
        removeModulesFromOrchard: {
            options: {
                orchard: '<%= config.paths.orchardDirectory %>',
                modules: config.excludeModules
            }
        },

        /**
         * Obtains a copy of Orchard for development / deployment.
         */
        orchardDownload: {
            options: {
                version: '<%= config.orchardVersion %>'
            }
        },
        
        /**
         * Creates symlinks of modules & theme directories into the local version
         * of Orchard.
         */
        symlink: {
            setupModules: {
                expand: true,
                overwrite: false,
                cwd: '<%= config.paths.modules %>',
                src: ['*'],
                dest: './local/<%= config.orchardVersion %>/src/Orchard.Web/Modules',
                filter: 'isDirectory'
            },
            setupThemes: {
                expand: true,
                overwrite: false,
                cwd: '<%= config.paths.themes %>',
                src: ['*'],
                dest: './local/<%= config.orchardVersion %>/src/Orchard.Web/Themes',
                filter: 'isDirectory'
            },
            teardownModules: {
                options: { teardown: true },
                files: [{
                    expand: true,
                    cwd: '<%= config.paths.modules %>',
                    src: ['*'],
                    dest: './local/<%= config.orchardVersion %>/src/Orchard.Web/Modules',
                    filter: 'isDirectory'
                }]
            },
            teardownThemes: {
                options: { teardown: true },
                files: [{
                    expand: true,
                    cwd: '<%= config.paths.themes %>',
                    src: ['*'],
                    dest: './local/<%= config.orchardVersion %>/src/Orchard.Web/Themes',
                    filter: 'isDirectory'
                }]
            }
        }
    });

    /**
     * -----
     * Custom inline grunt task.
     * -----
     */

    grunt.registerTask('transforms', 'Transform config files for the current target if required', function () {
        if (grunt.file.exists(deployment.transformFile)) {
            grunt.task.run('xdt:environment');
        }
    });

    /**
     * -----
     * Build tasks.
     * -----
     */

    /**
     * Builds and deploys Orchard to Azure. For this task all deployment 
     * parameters must be specifed.
     * Example:
     * `grunt deploy -target=dev -applicationName=orchard-development -computerName=https://orchard-development.scm.azurewebsites.net:443/msdeploy.axd?site=orchard-development -username=$orchard-development -password=w3M3JLgEhoHq5rMTJmFwlPG4QR3SW0dtkTz9hkQbc7oXJ1PJ8NC6MX9gxpxj`
     */
    grunt.registerTask('deploy', 'Deploys the distributable to an Azure server environment.', function () {
        if (!deployment.target || !deployment.applicationName || !deployment.computerName || !deployment.password || !deployment.username) {
            grunt.fail.fatal('Missing required parameters for deploy (`-target`, `-applicationName`, -computerName`, `-password`, `-username`).');
        }

        grunt.task.run(['clean:artifacts', 'build', 'transforms', 'copy:overridesEnvironment', 'compress:dist', 'string-replace:msdeployParamFile', 'msdeploy:orchard', 'clean:tidy']);
    });

    /**
     * Builds Orchard and copies a deployable version of Orchard which is placed
     * in the distributable directory (`/dist`).
     */
    grunt.registerTask('build-locally', ['clean:artifacts', 'build', 'copy:build']);

    /**
     * Builds Orchard by running the precompile task in Orchard and going through
     * and building each theme.
     */
    grunt.registerTask('build', ['orchardDownload', 'removeModulesFromOrchard', 'symlink:setupModules', 'addModulesToOrchard', 'symlink:teardownThemes', 'copy:overrides', 'shell:clickToBuild', 'msbuild:orchard', 'copy:configBuild', 'buildThemes', 'symlink:setupThemes']);

    /**
     * Sets up a local version of Orchard with custom modules, themes & configuration.
     */
    grunt.registerTask('setup', ['orchardDownload', 'removeModulesFromOrchard', 'symlink:setupModules', 'addModulesToOrchard', 'symlink:setupThemes', 'copy:overrides']);

    /**
     * Removes symlinks for modules & themes to the local orchard modules & theme
     * directories.
     */
    grunt.registerTask('teardown', ['symlink:teardownModules', 'symlink:teardownThemes']);
};
