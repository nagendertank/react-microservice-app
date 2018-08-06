import * as internalCache from './internalCache';

function __loadJS(jsElement, appDetail,apiGWURl, callback) {
    // DOM: Create the script element
    var jsElm = document.createElement("script");
    // set the type attribute
    jsElm.type = "text/javascript";
    // make the script element load file
    jsElm.src = apiGWURl + "/" + appDetail.name + '/' + appDetail.version +'/'+ jsElement.fileName+'.js';

    if (jsElm.readyState) {  //IE
        jsElm.onreadystatechange = function () {
            if (jsElm.readyState == "loaded" ||
                jsElm.readyState == "complete") {
                jsElm.onreadystatechange = null;
                callback(true);
            }
        };
    } else {  //Others
        jsElm.onload = function () {
            callback(true);
        };

        jsElm.onerror = function () {
            callback(false);
        };
    }
    // finally insert the element to the body element in order to load the script
    document.body.appendChild(jsElm);
}

function __loadCSS(cssElement, appDetail, apiGWURl, callback) {
    var head = document.getElementsByTagName('head')[0];
    // DOM: Create the script element
    var cssElem = document.createElement("link");
    // set the type attribute
    cssElem.type = "text/css";

    cssElem.rel ='stylesheet'
    // make the script element load file
    cssElem.href = apiGWURl + "/" + appDetail.name + "/" + appDetail.version + '/' + cssElement.fileName +'.css';

    head.appendChild(cssElem);

    if (cssElem.readyState) {  //IE
        cssElem.onreadystatechange = function () {
            if (cssElem.readyState == "loaded" ||
                cssElem.readyState == "complete") {
                cssElem.onreadystatechange = null;
                callback(true);
            }
        };
    } else {  //Others
        cssElem.onload = function () {
            callback(true);
        };

        cssElem.onerror = function () {
            callback(false);
        };
    }
    // finally insert the element to the body element in order to load the script
}

export default function loadBundles(name, specsData,apiGWURl,callback){
    let self = this;
    let componentLoaded = internalCache.componentLoaded;
    if (!componentLoaded[name] || (componentLoaded[name] && !componentLoaded[name]['isLoaded'])) {
        let serviceSpec = specsData.filter((data)=>{
                return data.service_name ===name;
            });

            componentLoaded[name] = [];
        if (serviceSpec && serviceSpec.length > 0) {
            let appData = serviceSpec[0];
                let iterator = 0;
                if (appData && appData.spec && appData.spec.resources.length>0){
                    let appDetail = appData.spec; 
                    appDetail.resources.forEach(element => {
                        if (element.type==='javascript'){
                            __loadJS(element, appDetail, apiGWURl,function (isLoaded) {
                                iterator++;
                                if (isLoaded){
                                    if (iterator === appDetail.resources.length){
                                        componentLoaded[name]['isLoaded'] = true;
                                        componentLoaded[name]['appDetail'] = appDetail;
                                        callback(true, appDetail);
                                    }
                                }else{
                                    callback(false);
                                }
                            });
                        }else{
                            __loadCSS(element, appDetail,apiGWURl,function (isLoaded) {
                                iterator++;
                                if (isLoaded) {
                                    if (iterator === appDetail.resources.length) {
                                        componentLoaded[name]['isLoaded'] = true;
                                        componentLoaded[name]['appDetail'] = appDetail;
                                        callback(true, appDetail);
                                    }
                                } else {
                                    callback(false);
                                }
                            });
                        }
                    });
                }else{
                    callback(false);
                }
            }else{
                callback(false);
            }
    } else if (componentLoaded[name]['isLoaded']) {
        let appDetail = componentLoaded[name]['appDetail'];
        callback(true, appDetail);
    }else{
        callback(false);
    }
}

