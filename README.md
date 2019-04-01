# reven
Small, powerfull fast and minimalistic front end web framework - less than 2kb gzipped

## How it works
It transpiles given in component method object into native javascript code so it is very fast and almost no execution overhead on framework itself.

## Usage
Framework defines two methods on HTMLElement class for accessing attributes (attribSet, attribGet), and you should use them instead of native ones (setAttribute, getAttribute) when accessing programatically attributes.
```javascript
    const element = document.createElement('div');
    element.attribSet('class', 'someStyle')
```

Every `template` element in HTML document containing attribute 'id' should hold component description.
```html
    <template id="main-page">
        <!-- place your html code here -->
        <!-- every element with attribute 'id' set will be available as variable with same name to component methods -->

        <script> 
            // placing script with component definition is optional and necesarry if you need to define certain behavior of component
            component({
                storage: false,
                methods: {

                },
                listen: [

                ],
                attributes: {
                    /* your attributes here */
                },
                lifecycle: {
                    /* lifecycle events here */
                },
                emits: {
                    /* define here list of events that this comopnent emits */
                }
            })
        </script>
        <style>
            /* place your styles here, they will be available only to that component */
            /* use CSS variables if necesarry */
        </style>
    </template>

    <!-- when all components are defined place 'raven' method with name of main component to execute -->
    <script>raven('main-page')</script>

```

### storage

Setting this property to 'true' makes component actually an state storage, element itself will be invisible. You can use events and attributes to manage communication between components

### methods

Defines local comopnent methods (they are not public, available only as variables to given component). Example:
```javascript
    methods: {
        hello: () => console.log('hello')
    }
```

### listen
Assigns methods that will act as event listeners to given by name elements
```javascript
    listen: [
        [{buttonClicked: 'click'}, ()=>{
            console.log('Button clicked')
        }],
        
        [{this: 'click'}, ()=>{
            console.log('Component clicked')
        }],

        [{this: ['blur', 'mouseover']}, ()=>{
            console.log('Component mouseover or blur')
        }],

    ]
```

### attributes
Defines component attributes. Simple way:
```javascript
    attributes: {
        title: (newValue, oldValue) => { // string type of attribute
            return newValue; // value returned here will be available as oldValue with next run
        },
        counter: [(newValue, oldValue) => { // non string type of attribute (object, array, boolean...)
            return newValue; // value returned here will be available as oldValue with next run
        }],
    }
```
With setters and getters:
```javascript
    attributes: {
        title: {
            set: (newValue, oldValue) => { // string type of attribute
                return newValue; // that value will be also passed to getter in next run
            },
            get: (value) => { // string type of attribute
                return value;
            }
        },
        counter: [{ // non string type of attribute (object, array, boolean...)
            set: (newValue, oldValue) => { // string type of attribute
                return newValue; // that value will be also passed to getter in next run
            },
            get: (value) => { // string type of attribute
                return value;
            }
        }],
    }
```
With setters, getters and initializers:
```javascript
    attributes: {
        title: {
            init: () => { let sharedValue = 'some title:'; }, // init is required to be an arrow function w/o arguments
            set: (newValue, oldValue) => { // string type of attribute
                console.log(sharedValue);
                return newValue; // that value will be also passed to getter in next run
            },
            get: (value) => { // string type of attribute
                console.log(sharedValue);
                return value;
            }
        },
        counter: [{ // non string type of attribute (object, array, boolean...)
            init: () => { let sharedValue = 10; },
            set: (newValue, oldValue) => { // string type of attribute
                console.log(sharedValue);
                return newValue; // that value will be also passed to getter in next run
            },
            get: (value) => { // string type of attribute
                console.log(sharedValue);
                return value;
            }
        }],
    }
```

### lifecycle
```javascript
    lifecycle: {
        init: () => {console.log('init')}, // init is required to be an arrow function w/o arguments
                                           // all variables consts and let will be available to all component methods 
        append: () => {console.log('append')},
        remove: () => {console.log('remove')},
        move: () => {console.log('move')}
    }
```

### emits
Defines events that component emits, these events can be used then by executing 'emit.[nameofevent]()'

```javascript
    emits: {
        titleChanged: true, // true is a short for {bubbles:true,composed:true}
        submitPerformed: {
            bubbles:true,
            composed:true
        }
    }
```