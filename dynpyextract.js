/* -------------------------------------------------------------------------- */
/*                                   Modules                                  */
/* -------------------------------------------------------------------------- */

const fs = require('fs')
const path = require('path');

const sanitize = require("sanitize-filename")

// ui
const program = require('commander');

// debug logging
const util = require('util');
const debugapp = util.debuglog('debugapp');
const debugfile = util.debuglog('debugfile');

//reading version number from package.json
var pjson = require('./package.json');

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates an array of files to process
 * @param {string} input Path to input file or folder
 * @returns {Promise} Promise resolves the array of files to process and their extension
 */
function processInput(input) {
    return new Promise((resolve, reject) => {

        const parsedInputPath = path.parse(input)
        debugapp('parsed input:', parsedInputPath)

        const ioType = {}
        ioType.input = checkInput(input) //folder or file

        const inputFiles = []

        if (ioType.input == 'folder') {
            try {
                const files = fs.readdirSync(input);
                debugapp('files in folder:', files)

                files.forEach(file => {
                    debugapp('file found in folder:', file)
                    let fileObj = parseInputFile(file, input)

                    if (fileObj) {
                        inputFiles.push(fileObj)
                        debugapp(input)
                    } else {
                        debugapp('File not supported:', file)
                    }

                });
            } catch (err) {
                console.log(err);
            }
        } else {
            let fileObj = parseInputFile(input)
            inputFiles.push(fileObj)
        }
        debugapp('input files:', inputFiles)
        resolve(inputFiles)
    })
}

/**
 * Parses an input file's extension.
 * @param {File} file Input file to parse
 * @param {Path} inputFolder Path to the root folder
 * @returns {Object} an object with the file and its extension. False if not correct file type
 */
function parseInputFile(file, inputFolder = false) {
    let parsed = path.parse(file)
    let fileObj = {}

    switch (parsed.ext) {
        case '.dyn':
        case '.dyf':
        case '.py':
            fileObj.file = (inputFolder) ? path.join(inputFolder, file) : file
            fileObj.ext = parsed.ext
            return fileObj
            break;

        default:
            return false
            break;
    }
}

/**
 * Returns python nodes from imput files
 * @param {Array} inputFiles The list of input files and other data
 * @returns {Promise} Promise resolves to an array of python nodes in files
 */
function dynToPy(inputFiles) {
    return new Promise((resolve, reject) => {

        const pythonFiles = []

        for (let i = 0; i < inputFiles.length; i++) {
            try {
                const data = fs.readFileSync(inputFiles[i].file, "utf-8")

                readPythonFromDyn(data, inputFiles[i].file)
                    .then((pythonString) => {
                        if (pythonString.length > 0) {
                            pythonFiles.push(pythonString)
                        }
                    })
            } catch (err) {
                debugapp(err)

                console.log('File doesn\'t exists:', inputFiles[i].file)
            }
        }
        resolve(pythonFiles)
    })
}

/**
 * Checks if the input is file or folder
 * @param {Path} input Checks if an input is file or folder
 * @returns {String} 'file' or 'folder'
 */
function checkInput(input) {

    const parsedInputPath = path.parse(input)

    if (fs.existsSync(input) && fs.lstatSync(input).isDirectory()) {
        // input is a folder
        return 'folder'

    } else if (parsedInputPath.ext == '.dyf' || parsedInputPath.ext == '.dyn') {
        // input is a file
        return 'file'

    } else {
        // input nor a dyf or dyn nor folder
        debugapp('ERROR')
        console.log('Please use a .dyf or .dyn file or a folder as an input.')
        process.exit()
    }
}

function savePyFile(pythonFiles, output) {
    return new Promise((resolve, reject) => {
        let outputType = checkOutput(output) //'folder' or 'file' or false

        if (outputType == 'file' && pythonFiles.length > 1) {
            console.log('Invalid output. Use folder or nothing for multiple file inputs ')
        } else if (outputType == 'file' && pythonFiles.length == 1) {
            if (pythonFiles[0].length == 1) {
                fs.writeFileSync(output, pythonFiles[0][0].code)
            } else {
                for (let i = 0; i < pythonFiles[0].length; i++) {
                    const element = pythonFiles[0][i];
                    let parsedOutput = path.parse(output)
                    let writePath = path.join(parsedOutput.dir, parsedOutput.name + '-' + i.toString() + parsedOutput.ext)
                    fs.writeFileSync(writePath, pythonFiles[0][i].code)
                }
            }

            debugapp(pythonFiles[0])
        }




    })
}



function checkOutput(output = false) {

    let parsedOutputPath = path.parse(output)

    if (output && fs.existsSync(output) && fs.lstatSync(output).isDirectory()) {
        // ouput exists and a folder
        return 'folder'

    } else if (output && parsedOutputPath.ext == '.py') {
        // output exists and is a .py file
        return 'file'

    } else if (output) {
        // output exists but not folder, nor py file
        debugapp('ERROR')
        console.log('Output invalid')
        process.exit()
    } else {
        return false
    }
}


/**
 * Read contents of a dynamo file, resolves to an array of python nodes
 * @param {String} data Full contents of a dynamo file
 * @param {String} inputFile Filename of the source file
 * @returns {Array} Array of objects of python nodes
 */
function readPythonFromDyn(data, inputFile) {
    return new Promise((resolve, reject) => {

        //parse as json
        parsedJson = JSON.parse(data)

        const fileUuid = parsedJson.Uuid

        const pythonString = []

        //find python nodes
        for (let i = 0; i < parsedJson.Nodes.length; i++) {
            const singleNode = parsedJson.Nodes[i];
            if (singleNode.NodeType == 'PythonScriptNode') {
                debugfile("### Id:", singleNode.Id)
                debugfile(singleNode.Code)
                debugfile(singleNode)
                pythonString.push({
                    id: singleNode.Id,
                    code: singleNode.Code,
                    path: inputFile,
                    uuid: fileUuid,
                    dpeVersion: pjson.version
                })
            }
        }
        resolve(pythonString)

    })

}



/* -------------------------------------------------------------------------- */
/*                                     UI                                     */
/* -------------------------------------------------------------------------- */

program
    .version(pjson.version)
    .description(pjson.description)
    .option('-f, --force', 'Overwrite all files')
    .option('-u, --update', 'Overwrite only older files')
    .option('-h, --help', 'Show this help')
// .option('-v --version', 'Version information')


program.command('extract <input> [output]')
    .description('Extract python code from Dynamo files\r\n[output] is optional. If no output given .py files will be placed next to Dynamo files')
    .action(function (inputPath, ouputPath = false) {
        debugapp('input:', inputPath, 'ouput:', ouputPath)
        if (inputPath) {
            processInput(inputPath)
                .then((inputFiles) => {
                    return dynToPy(inputFiles)
                }).then((pythonFiles) => {
                    debugapp(pythonFiles)
                    savePyFile(pythonFiles, ouputPath)

                })
        } else {
            console.log("Input path required")
        }
    })

program.command('update <input> [output]')
    .description('Update python nodes in Dynamo files from .py files\r\n[output] is optional. If no output given, the original files will be updated')
    .action(function (inputPath, ouputPath) {
        debugapp('')
    })



program.parse(process.argv)


/*
input: file ->  output: file
                output: folder -> generate filename
                ontput: no     -> get folder -> generate filename

input: folder -> output: folder
                 output : no -> get filenames -> generate filenames



*/