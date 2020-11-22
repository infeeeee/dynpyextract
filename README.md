# dynpyextract

Extract Python code from Dynamo files

## Install

## Usage

```
Usage: dynpyextract [options] [command]

Extract Python code from Dynamo files

Options:
  -V, --version             output the version number
  -f, --force               Overwrite all files
  -u, --update              Overwrite only older files
  -h, --help                Show this help

Commands:
  extract <input> [output]  Extract python code from Dynamo files
                            [output] is optional. If no output given .py files will be placed next to Dynamo files
  update <input> [output]   Update python nodes in Dynamo files from .py files
                            [output] is optional. If no output given, the original files will be updated
  help [command]            display help for command
```

## Development

### Install

```
git clone https://github.com/infeeeee/dynpyextract
cd dynpyextract
npm i
npm start -- -help
npm start extract "C:\path\to\mycommand.dyf"
```

### Enable verbose log, debugging

Start with environment variable `NODE_DEBUG` set to `debug*`.

Example on Windows:

```
SET NODE_DEBUG=debug*
npm start extract "C:\path\to\mycommand.dyf"
```

#### Possible debug levels:

- `debug*`: all messages
- `debugapp`: main messages
- `debugfile`: messages about the input files

## License

MIT