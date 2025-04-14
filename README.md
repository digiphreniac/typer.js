# typer.js

A smart typer object that makes it easy to queue messages and groups of messages for a precise user experience.

- [Using typer.js](#using-typerjs)
  - [Import and instantiate](#import-and-instantiate)
  - [Basic usage](#basic-usage)
  - [Advanced usage](#advanced-usage)
- [Typer Overview](#typer-overview)
  - [Functions](#functions)
    - [Constructor](#typerhtmlelement-options)
    - [`render()`](#render)
    - [`type(content)`](#typecontent)
    - [`flush()`](#flush)
    - [`hide()`](#hide)
    - [`show()`](#show)
  - [Data Structures](#data-structures)
    - [`message`](#message)
    - [`screen`](#screen)

## Using `typer.js`

### Import and instantiate
```javascript
import Typer from './typer.js';

displayArea = document.getElementById('typer-element');

const typerObj = new Typer(displayArea, { speed: 40 });
```

### Basic usage
```javascript
typerObj.render();

textScreens = [
  {
    messages: [
      { data: "Hello, world", pauseMs: 750 },
      { data: "\n", pauseMs: 1000 },
      { data: "\n\nThis is another line" },
    ],
  }
];

setTimeout(() => typerObj.type(textScreens), 1800);
```

### Advanced usage
This was originally built for loading (typing) content sent from an API. The API sent content based on outside factors beyond client-side logic. This is a barebones example of how that can be achieved using `typer.js`.

Example payload from `apiClient.getScreenContents`:
```json
[
  {
    "messages": [
      { "data": "Hello world." },
      { "data": "\n" },
      { "data": "Let's change the color to red" }
    ],
    "pauseMs": 50,
    "onDoneCallback": "changeColorToRed"
  }
]
```

```javascript
const onDoneCallbackFunctions = {
  changeColorToRed: (unlockCallback) => {
    document.body.style.color = "#FF0000";

    unlockCallback();
  },
  // ...
};


try {
  textScreens = await apiClient.getScreenContents()
  textScreens.forEach((screen) => {
    // if the screen has a callback, find and apply it
    if (screen.onDoneCallbackFnName) {
      screen.onDoneCallback = onDoneCallbackFunctions[screen.onDoneCallbackFnName];
    }
  });
}
catch(err) {
  textScreens = [
    {
      messages: [
        { data: "an error occurred loading content.", pauseMs: 750 },
        { data: "\n\nerror details:", pauseMs: 650 },
        { data: "\n", pauseMs: 200 },
        { data: err.message },
      ]
    }
  ];
}

typerObj.render();
typerObj.type(textScreens);
```

## Typer Overview

### Functions

|                    Method | Description                                                                                   |
|--------------------------:|-----------------------------------------------------------------------------------------------|
| `Typer(HTMLElement, options)` | Constructor, requires an [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)                                                                                   |
|                `render()` | Render the typer container on the page (cursor will appear even before `type()` isn't called) |
|           `type(content)` | Adds `content` to the queue (will be typed when ready)                                       |
|                 `flush()` | Flush screen                                                                                  |
|                  `hide()` | Hide the typer's container `Element`                                                          |
|                  `show()` | Show the typer's container `Element`                                                          |

#### `Typer(HTMLElement, options)`
A simplified Typer object that can write screens of text to a given container element.

##### Parameters
- `HTMLElement` A valid [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) (i.e., a `p`)
- `options` An optional JSON including options. See the default `options` object below.
  ```json
  {
    "cursorChar": "|",
    "speed": 60,
    "refreshTimeMs": 250,
    "defaultPauseTimeMs": 200,
    "defaultScreenPauseTimeMs": 1000
  }
  ```

#### `render()`
Render the typer container on the page

#### `type(content)`
Adds `content` (a list of [`screen`](#screen) objects) to the queue that will be typed when ready. \
Also starts an interval that watches the queue

#### `flush()`
Flush (clear) the screen

#### `hide()`
Hide the typer (typing area) element

#### `show()`
Show the typer (typing area) element

### Data Structures
#### `message`
A message is a JSON object representing text. The properties for a `message` object are described below.

| property | required | description |
| -------: | --- | ----------- |
| `data` | ✅| The text to be written |
| `pauseMs` | | The duration (in milliseconds) to pause after `data` is written (before the typer will continue onto its next task) | 

##### Example
```json
{
  "data": "Hello, world",
  "pauseMs": 2500
}
```

#### `screen`
A screen is a JSON object that includes the following properties

| property | required | description |
| -------: | --- | ----------- |
| `messages` | ✅ | An array of [`message`](#message) objects |
| `pauseMs`  |  | The duration (in milliseconds) to pause (lock) the screen after all content is written |
| `onDoneCallback` |  | A callback function that will be invoked after the screen is unlocked (after all content is typed and `pauseMs` has passed). [More info](#using-the-screen-ondonecallback) |

##### Example
```json
{
  "messages": [
    {
      "data": "Hello, world",
      "pauseMs": 2500
    }
  ],
  "pauseMs": 5000,
  "onDoneCallback": "changeColorToRed"
}
```

##### Using the screen `onDoneCallback`
Providing an `onDoneCallback` function is simple. The function will be passed an `unlockCallback` function parameter which **must be called**. If the `unlockCallback` is not called, the typer will never unlock the screen and be stuck indefinitely.
```javascript
const changeColorToRed = (unlockCallback) => {
  document.body.style.color = "#FF0000";

  unlockCallback(); // This must be called within the callback
}


const screen = {
  "messages": [ { "data": "Hello, world" } ],
  "onDoneCallback": changeColorToRed
}
```