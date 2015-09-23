var path = require('path');

module.exports = function(grunt) {

        /**
         * Version of Orchard to use.
         */
    var ORCHARD_VERSION = '1.9.1',

        /**
         * Contain credentials for deployment.
         */
        deployment;

    /**
     * Properties used by tasks.
     */
    var config = {
        version: ORCHARD_VERSION,

        // paths to directories / files used in the process.
        paths: {
            overrides: './overrides',
            themes: './themes',
            modules: './modules',
            deployment: './deployment',

            // msdeploy doesn't function unless this is an absolute path.
            dist: path.resolve('./dist'),

            // path to directory that contains Orchard.
            orchardDirectory: path.join('local', ORCHARD_VERSION),

            // path to Orchard project file.
            orchardProjectFile: path.join('local', ORCHARD_VERSION, 'Orchard.proj'),

            // path to artifacts created by Orchard build tasks.
            orchardBuildArtifacts: path.join('local', ORCHARD_VERSION, 'build/Precompiled'),

            // path to files included in MsDeploy package in order to deploy Orchard.
            orchardMsDeployFiles: path.join('local', ORCHARD_VERSION, 'lib/msdeploy')
        }
    };

    /**
     * loads a configuration file for the server environment that is about to
     * be deployed to.
     */
    if (grunt.option('target')) {
        deployment = grunt.file.readJSON(path.join(config.paths.deployment, grunt.option('target'), 'server.json'));
        deployment.parametersFile = path.join(config.paths.deployment, grunt.option('target'), 'setparameters.xml');
        deployment.transformFile = path.join(config.paths.deployment, grunt.option('target'), 'transforms/Web.Transform.config');
    }

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
            artifacts: ['<%= config.paths.dist %>']
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
             * Copies override files in the web project root directory in the local v
             ersion of Orchard's web project.
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
            overrides: {
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
                    dest: "auto,ComputerName='<%= deployment.computerName %>',UserName='<%= deployment.userName %>',Password='<%= deployment.password %>',AuthType='Basic',includeAcls='False'",
                    disableLink: ['AppPoolExtension','ContentExtension','CertificateExtension'],
                    skip: 'Directory=App_Data',
                    setParamFile: '<%= deployment.parametersFile %>'
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
         * Obtains a copy of Orchard for development / deployment.
         */
        orchardDownload: {
            options: {
                version: '<%= config.version %>'
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
                dest: './local/<%= config.version %>/src/Orchard.Web/Modules',
                filter: 'isDirectory'
            },
            setupThemes: {
                expand: true,
                overwrite: false,
                cwd: '<%= config.paths.themes %>',
                src: ['*'],
                dest: './local/<%= config.version %>/src/Orchard.Web/Themes',
                filter: 'isDirectory'
            },
            teardownModules: {
                options: { teardown: true },
                files: [{
                    expand: true,
                    cwd: '<%= config.paths.modules %>',
                    src: ['*'],
                    dest: './local/<%= config.version %>/src/Orchard.Web/Modules',
                    filter: 'isDirectory'
                }]
            },
            teardownThemes: {
                options: { teardown: true },
                files: [{
                    expand: true,
                    cwd: '<%= config.paths.themes %>',
                    src: ['*'],
                    dest: './local/<%= config.version %>/src/Orchard.Web/Themes',
                    filter: 'isDirectory'
                }]
            }
        }
    });

    /**
     * -----
     * Third party plugins used in the build process.
     * -----
     */

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-symlink');
    grunt.loadNpmTasks('grunt-msbuild');
    grunt.loadNpmTasks('grunt-msdeploy');
    grunt.loadNpmTasks('grunt-orchard-shell');
    grunt.loadNpmTasks('grunt-xdt');

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
     * Builds and deploys Orchard. For this task a `-target` must be specifed. This
     * target must have a directory whose name matches the value of the `-target`
     * parameter otherwise the task will fail.
     * Example:
     * `grunt deploy -target=example`
     */
    grunt.registerTask('deploy', ['clean:artifacts', 'build', 'transforms', 'copy:overrides', 'compress:dist', 'msdeploy:orchard']);

    /**
     * Builds Orchard and copies a deployable version of Orchard which is placed
     * in the distributable directory (`/dist`).
     */
    grunt.registerTask('build-locally', ['clean:artifacts', 'build', 'copy:build']);

    /**
     * Builds Orchard by running the precompile task in Orchard and going through
     * and building each theme.
     */
    grunt.registerTask('build', ['orchardDownload', 'symlink:setupModules', 'addModulesToOrchard', 'symlink:teardownThemes', 'copy:overrides', 'msbuild:orchard', 'copy:configBuild', 'buildThemes', 'symlink:setupThemes']);

    /**
     * Sets up a local version of Orchard with custom modules, themes & configuration.
     */
    grunt.registerTask('setup', ['orchardDownload', 'symlink:setupModules', 'addModulesToOrchard', 'symlink:setupThemes', 'copy:overrides']);

    /**
     * Removes symlinks for modules & themes to the local orchard modules & theme
     * directories.
     */
    grunt.registerTask('teardown', ['symlink:teardownModules', 'symlink:teardownThemes']);
};
