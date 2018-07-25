const classNameRegex = /className=\"([0-9a-zA-Z\-\_\s]*)\"/ig;
const classNamesRegex = /classnames\(((.|\s)*?)\)/img;
const stringBetweenQuotesRegex = /(["'])(\\?.)*?\1/img;
import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';
import path from 'path';
let ignore = [];
var fs = require('fs');
var async = require('async');

let modifiedSource = null;


const schema = {
    type: 'object',
    properties: {
        fileName: {
            type: 'array'
        },
        prefix :{
            type:'string'
        }
    }
};

function loader(source, inputSourceMap) {
   
    const options = getOptions(this);
    const self = this;

    const callback = this.async();

    let cssContent = '';
    
    validateOptions(schema, options, 'React ClassName Prefix Loader');
    
    async.eachSeries(
        // Pass items to iterate over
        options.fileName,
        // Pass iterator function that is called for each item
        function (filename, cb) {
            fs.readFile(filename, "utf8", function (err, content) {
                var filePath = path.resolve(filename);

                self.addDependency(filePath);
                
                cssContent = cssContent.concat(content);
                cssContent = cssContent.concat('\n');
                // Calling cb makes it go to the next item.
                cb(err);
            });
        },
        // Final callback after each item has been iterated over.
        function (err) {
            checkFiles(cssContent, options.prefix, source, function () {
                callback(null, modifiedSource, inputSourceMap);
            });
        }
    );
}


function checkFiles(content,prefix,source,callback){
        if (prefix) {
            // Process classes with classnames module
            let classNamesMatches = source.match(classNamesRegex);

            if (classNamesMatches) {
                classNamesMatches.map(item => {
                    item = item.replace(/\s+/g, '');

                    let classNamesMatchesStrings = item.match(stringBetweenQuotesRegex);

                    if (classNamesMatchesStrings) {
                        classNamesMatchesStrings.map(item => {
                            modifiedSource = source.replace(new RegExp(item, 'g'), text => {
                                const replaceResult = "'" + prefix + text.replace(/['"]/g, '') + "'";
                                ignore.push(replaceResult);
                                return replaceResult;
                            });
                        });
                    }
                });
            }

            modifiedSource = source.replace(classNameRegex, (text, classNames) => {
                let attr = text.match(/classname/ig);
                if (attr && attr[0]) {
                    attr = attr[0];
                } else {
                    attr = 'className';
                }

                let prefixedClassNames = classNames
                    .split(' ')
                    .map((className) => {
                        if (className.indexOf(prefix) >= 0 || ignoreClassName(className) || content.indexOf(className) < 0){
                            return className;
                        }

                        return `${prefix}${className}`;
                    })
                    .join(' ');

                return `${attr}='${prefixedClassNames}'`;
            });
        }

    callback();
}

function ignoreClassName(className, options = {}) {
    return classMatchesTest(className, options.ignore) ||
        className.trim().length === 0 ||
        /^[A-Z-]/.test(className) ||
        ignore.findIndex(item => className === item) >= 0;
}

function classMatchesTest(className, ignore) {
    if (!ignore) return false

    className = className.trim()

    if (ignore instanceof RegExp) return ignore.exec(className)

    if (Array.isArray(ignore)) {
        return ignore.some((test) => {
            if (test instanceof RegExp) return test.exec(className)

            return className === test
        })
    }

    return className === ignore
}

export default loader;
