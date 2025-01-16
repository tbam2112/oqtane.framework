const scriptKeys = new Set();

export function onUpdate() {
    // determine if this is an enhanced navigation
    let enhancedNavigation = scriptKeys.size !== 0;

    // iterate over all script elements in document
    const scripts = document.getElementsByTagName('script');
    for (const script of Array.from(scripts)) {
        // only process scripts that include a data-reload attribute
        if (script.hasAttribute('data-reload')) {
            let key = getKey(script);

            if (enhancedNavigation) {
                // reload the script if data-reload is "always" or if the script has not been loaded previously and data-reload is "once" or "true"
                let dataReload = script.getAttribute('data-reload');
                if (dataReload === 'always' || (!scriptKeys.has(key) && (dataReload == 'once' || dataReload === 'true'))) {
                    reloadScript(script);
                }
            }

            // save the script key
            if (!scriptKeys.has(key)) {
                scriptKeys.add(key);
            }
        }
    }
}

function getKey(script) {
    if (script.src) {
        return script.src;
    } else if (script.id) {
        return script.id;
    } else {
        return script.innerHTML;
    }
}

function reloadScript(script) {
    try {
        if (isValid(script)) {
            replaceScript(script);
        }
    } catch (error) {
        if (script.src) {
            console.error(`Script Reload failed to load external script: ${script.src}`, error);
        } else {
            console.error(`Script Reload failed to load inline script: ${script.innerHTML}`, error);
        }
    }
}

function isValid(script) {
    if (script.innerHTML.includes('document.write(')) {
        console.log(`Script using document.write() not supported by Script Reload: ${script.innerHTML}`);
        return false;
    }
    return true;
}

function replaceScript(script) {
    return new Promise((resolve, reject) => {
        var newScript = document.createElement('script');

        // replicate attributes and content
        for (let i = 0; i < script.attributes.length; i++) {
            newScript.setAttribute(script.attributes[i].name, script.attributes[i].value);
        }
        newScript.innerHTML = script.innerHTML;
        newScript.removeAttribute('data-reload');

        // dynamically injected scripts cannot be async or deferred
        newScript.async = false;
        newScript.defer = false;

        newScript.onload = () => resolve();
        newScript.onerror = (error) => reject(error);

        // remove existing script element
        script.remove();

        // replace with new script element to force reload in Blazor
        document.head.appendChild(newScript);
    });
}