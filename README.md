# dynpyextract

Extract Python code from Dynamo files

## Install

## Usage

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

`debug*`: all messages
`debugapp`: main messages
`debugfile`: messages about the input files

## License

MIT