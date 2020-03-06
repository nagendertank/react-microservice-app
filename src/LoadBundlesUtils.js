import * as internalCache from './internalCache';

function __loadJS(jsElement, appDetail,apiGWURl, token, callback) {
    // DOM: Create the script element
    var jsElm = document.createElement("script");
    // set the type attribute
    jsElm.type = "text/javascript";
    
    if (appDetail.containerName) {
        jsElm.src = apiGWURl + "/" + appDetail.containerName + '/' + jsElement.fileName + '.js';
    } else {
        jsElm.src = apiGWURl + "/" + appDetail.name + "/" + appDetail.version + "/" + jsElement.fileName + '.js';
    }

    if(token) {
        jsElm.src = jsElm.src + token;
    }

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

function __loadCSS(cssElement, appDetail, apiGWURl, token, callback) {
    var head = document.getElementsByTagName('head')[0];
    // DOM: Create the script element
    var cssElem = document.createElement("link");
    // set the type attribute
    cssElem.type = "text/css";

    cssElem.rel ='stylesheet'
    if (appDetail.containerName) {
        cssElem.href = apiGWURl + "/" + appDetail.containerName + "/" + cssElement.fileName + '.css';
    } else {
        cssElem.href = apiGWURl + "/" + appDetail.name + "/" + appDetail.version + "/" + cssElement.fileName + '.css';
    }

    if(token) {
        cssElem.href = cssElem.href + token;
    }

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

function checkToken(token){
    if(token && token.tokenPromise)
        return token.tokenPromise()
    else return Promise.resolve()
}

export default function loadBundles(name, specsData,apiGWURl,token,callback){
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
                    checkToken(token).then(tokenPromise=>{
                        let bundleQueryParams = tokenPromise ? token.staticToken + "&" + (token.parseData? token.parseData(tokenPromise):tokenPromise) : token;
                        let appDetail = appData.spec; 
                        appDetail.resources.forEach(element => {
                            if (element.type==='javascript'){
                                __loadJS(element, appDetail, apiGWURl,bundleQueryParams, function (isLoaded) {
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
                                __loadCSS(element, appDetail,apiGWURl,bundleQueryParams, function (isLoaded) {
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
                    })
                    .catch((err)=>{
                        callback(false)
                    })
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
