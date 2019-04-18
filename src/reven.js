/*
    License: MIT
    Author: Daniel Mazurkiewicz
*/

Element.prototype.attribSet = function(nameOrObject, value) {
    if (typeof nameOrObject === 'string') {
        const a=this.___a&&this.___a[nameOrObject];a?a.v=a.s(value,a.v):this.setAttribute(nameOrObject, value);
    } else {
        for (let name in nameOrObject) {
            const a=this.___a[name];a?a.v=a.s(nameOrObject[name],a.v):this.setAttribute(nameOrObject[name], value);
        }
    }
}
Element.prototype.attribGet = function(nameOrObject) {
    if (typeof nameOrObject === 'string') {
        const a=this.___a&&this.___a[nameOrObject];
        return a?a.g(a.v):this.getAttribute(nameOrObject);
    } else {
        let result = {};
        nameOrObject = nameOrObject || this.___a;
        for (let name in nameOrObject) {
            const a=this.___a&&this.___a[name];result[name] = a?a.g(a.v):this.getAttribute(name);
        }
        return result;
    }
}

const forEachElement = (elementsOrName, callback, doc = document) => {
    if (typeof elementsOrName === 'string') {
        elementsOrName = doc.getElementsByTagName(elementsOrName);
    } else if (elementsOrName.query) {
        elementsOrName = doc.querySelectorAll(elementsOrName.query);
    }

    for (let i = 0; i < elementsOrName.length; i++) {
        callback(elementsOrName[i], i);
    }
}


function createElement(name, attributes) {
    const element = document.createElement(name);
    if (attributes) element.attribSet(attributes);
    return element;
}

function getArrowFunctionBody(func) {
    if (typeof func !== 'string') func = func.toString();
    const start = func.indexOf('{');
    const end = func.lastIndexOf('}');
    if(start < 0 || end < 0 || func.substring(0, start).replace(/[\n\r\t\s]/g, '') !== '()=>') throw new Error(`Improper function, should be only arrow function like that: () => { ... body ... }, yours:\n${func}`);
    return func.substring(start + 1, end)
}

function createHTMLElementClassString({returns, className = 'ThisClass', inherit = 'HTMLElement', attributes, lifecycle, elements, template, methods, listen, emits, storage}) {
    let result = '';

    if (returns) {
        result += 'return ';
    }
    if (inherit) {
        if (typeof inherit !== 'string') inherit = inherit.name;
        result += `class ${className} extends ${inherit}{`
    } else {
        result += `class ${className}{`
    }

    if (attributes && (attributes=Object.entries(attributes)).length) {
        result += `static get observedAttributes(){return ${JSON.stringify(attributes.map(([name])=>name))}};`;
        result += `attributeChangedCallback(n,ov,nv){const a=this.___a[n];if(!a.is)nv=JSON.parse(nv);a.v=a.s(nv,a.v)};`;
    }

    template = template ? `document.getElementById(${JSON.stringify(template)})` : 'template';

    result += `constructor(){super();`;
    if (storage) {
        result += `this.style.display='none';`;
    } else {
        result += `const shadow=this.attachShadow({mode:'open'}),clon=${template}.content.cloneNode(true);shadow.appendChild(clon);`;
        if (elements && elements.length) {
            result += `const ${elements.map(e=>`${e}=shadow.getElementById(${JSON.stringify(e)})`).join(',')};`
        }
    }

    if (emits && (emits=Object.entries(emits)).length) {
        result += `const emit={${emits.map(([name, options])=>
            `${name}:()=>this.dispatchEvent(new Event(${JSON.stringify(name)},${options===true?'{bubbles:true,composed:true}':JSON.stringify(options)}))`).join(`,`)}};`;
    }

    if (methods && (methods=Object.entries(methods)).length) {
        result += `const ${methods.map(([name, fun])=>`${name}=${fun.toString()}`).join(`,`)};`;
    }

    if (lifecycle && lifecycle.init) result += `\n${getArrowFunctionBody(lifecycle.init)};`;

    if (listen && listen.length) {
        let useVariable;
        result += listen.map( e => {
            let fun, options, elementsEvents=[];
            e.forEach( d=> {
                if (typeof d === 'string') {
                    fun = d;
                } else if (typeof d === 'function') {
                    fun = d.toString();
                } else if (typeof d === 'boolean') {
                    options = d;
                } else if (d instanceof Array) {
                    options = d[0] ? JSON.stringify(d[0]) : undefined;
                } else {
                    Object.entries(d).forEach(([element, event]) => {
                        if (event instanceof Array) {
                            event.forEach(event => elementsEvents.push({element, event}))
                        } else {
                            elementsEvents.push({element, event});
                        }
                    })
                }
            })
            if (elementsEvents.length === 1) {
                const ee = elementsEvents[0];
                return `${ee.element}.addEventListener(${JSON.stringify(ee.event)},${fun}${options !== undefined ? `,${options}`:''});`
            } else if (elementsEvents.length > 1) {
                return (!useVariable ? (useVariable = true, `let `) : '') + `____tmp=${fun};` + elementsEvents.map(ee => {
                    return `${ee.element}.addEventListener(${JSON.stringify(ee.event)},____tmp${options !== undefined ? `,${options}`:''});`
                }).join('');
            }

        }).join('');
    }

    if (lifecycle) {
        if (lifecycle.append) result += `this.__la=${lifecycle.append.toString()};`;
        if (lifecycle.remove) result += `this.__lr=${lifecycle.remove.toString()};`;
        if (lifecycle.move) result += `this.__lm=${lifecycle.move.toString()};`;
    }

    if (attributes && attributes.length) {
        result += `this.___a={${
            attributes.map(([name, attribute])=>{
                const isString = !(attribute instanceof Array);
                if (!isString) attribute = attribute[0];
                let result = `${JSON.stringify(name)}:`;
                if (attribute.init) result += `(()=>{${getArrowFunctionBody(attribute.init)};return `
                if (typeof attribute === 'function') {
                    result += `{g:v=>v,s:${attribute.toString()}${isString?",is:1":""}}`; //is - is string
                } else {
                    result += `{${
                            (attribute.get ? `g:${attribute.get.toString()},` : `g:v=>v,`) +
                            (attribute.set ? `s:${attribute.set.toString()}` : `s:()=>{}`) +
                            (isString ? ',is:1' : '')
                    }}`;
                }
                return result + (attribute.init ? `})()` : '')
            }).join(',')
        }};`
    }
    result += `};`; // end of constructor

    if (lifecycle) {
        if (lifecycle.append) result += `connectedCallback(){this.__la()};`;
        if (lifecycle.remove) result += `disconnectedCallback(){this.__lr()};`;
        if (lifecycle.move) result += `adoptedCallback(){this.__lm()};`;
    }

    result += '};'; // end of class
    return result;
}

function reven(mainComponentName, mainComponentAttributes) {
    forEachElement('template', template => {
        const tagName = template.getAttribute('id');
        const parser = new DOMParser();
        const doc = parser.parseFromString(template.innerHTML, 'text/html');

        const componentElements = [];
        forEachElement({query:'[id]'}, (idElement) => {
            componentElements.push(idElement.getAttribute('id'));
        }, doc);

        let component;
        forEachElement('script', script => {
            if (component) throw new Error('Can not declare more than one component in a template');
            try {(new Function('component', script.innerText))(c => component = c)} catch (e) {console.error(`ERROR in component ${tagName}: ${e.message}`)};
            script.parentNode.removeChild(script);
        }, doc);

        if (!component) component = {};
        template.innerHTML = doc.body.innerHTML; // template content without scripts
        component.elements = componentElements;
        component.returns = true;
        const NewElement = (new Function('template', createHTMLElementClassString(component)))(template);
        customElements.define(tagName, NewElement);
    })
    document.body.appendChild(createElement(mainComponentName, mainComponentAttributes));
}

