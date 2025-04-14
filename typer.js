const UNLOCKED = 0;
const LOCKED = 1;

const defaultCallback = (unlockCallback) => {
  unlockCallback();
};

// This is the closest to "callback hell" I've ever been lmao

/*
 * A simplified Typer object that can write screens of text to a given container element.
 */
export default class Typer {
  constructor(
    containerElement,
    {
      cursorChar="|",
      speed=60,
      refreshTimeMs=250,
      defaultPauseTimeMs=200,
      defaultScreenPauseTimeMs=1000
    } = {}) {
    this.containerElement = containerElement;
    this.cursorChar = cursorChar;
    this.speed = speed;
    this.defaultPauseTimeMs = defaultPauseTimeMs;
    this.defaultScreenPauseTimeMs = defaultScreenPauseTimeMs;
    this.refreshTimeMs = refreshTimeMs;
    this.queue = [];
    this.typerLock = UNLOCKED;
    this.isAlreadyRendered = false;
  }
  
  /*
   * Render the typer container on the page
   */
  render() {
    if (this.isAlreadyRendered) return this.show();

    const cursorEl = document.createElement('span');
    cursorEl.appendChild(document.createTextNode(this.cursorChar));
    cursorEl.style.display = "none";
    cursorEl.id = "cursor";

    this.containerElement.parentElement.appendChild(cursorEl);
    setTimeout(() => {
      cursorEl.style.display = 'inline';
    }, 300);

    this.isAlreadyRendered = true;
  }

  /*
   * Adds content to the queue (will be typed when ready).
   * Also starts an interval that watches the queue
   */
  type(content) {
    this.queue = this.queue.concat(content);

    if (!this.queueMonitorInterval) {
      this.queueMonitorInterval = setInterval(() => {
        this.#typeQueue();
      }, this.refreshTimeMs);
    }
  }


  /*
   * Flush screen
   */
  flush() {
    this.containerElement.innerHTML = '';
  }


  /*
   * Hide the typer (typing area)
   */
  hide() {
    this.containerElement.parentElement.style.display = 'none';
  }

  /*
   * Show the typer (typing area)
   */
  show() {
    this.containerElement.parentElement.style.display = 'block';
  }

  /*
   * Type the first item in queue.
   * Takes control of the typerLock to stop overwriting other messages.
   */
  #typeQueue() {
    if (this.typerLock == LOCKED || this.queue.length === 0) {
      return;
    }

    this.typerLock = LOCKED;

    const data = this.queue.shift(); // pop first data

    this.flush();
    this.#typeScreen(data); 
  }


  /*
   * Types content from the `screen`.
   * Leverages callbacks to invoke the next message after current message is finished writing.
   * Once entire screen is written, pauses and gives up the `typerLock`.
   */
  async #typeScreen({ messages, pauseMs=this.defaultScreenPauseTimeMs, onDoneCallback=defaultCallback }) {
    const callbacks = new Array(messages.length).fill(undefined);

    for (let i = messages.length; i >= 0; --i) {
      let callbackToAdd;

      if (i + 1 == messages.length) {
        // last word's callback just does a timeout and unlocks the lock (and invokes onDoneCallback)
        callbackToAdd = () => {
          setTimeout(() => {
            const unlockCallback = () => {
              this.typerLock = UNLOCKED;
            };

            onDoneCallback(unlockCallback);
          }, pauseMs);
        };
      }
      else {
        // create a callback that references the next word's callback
        callbackToAdd = () => {
          this.#addText(messages[i + 1], callbacks[i + 1]);
        };
      };

      callbacks[i] = callbackToAdd;
    }

    this.#addText(messages[0], callbacks[0]);
  }


  /*
   * Writes `data` text to the screen (using recursive calls).
   * Once all of the data is written, pauses and invokes callback.
   */
  #addText({ data, pauseMs=this.defaultPauseTimeMs }, doneCallback, index=0) {
    if (index < data.length) {
      if (data[index] == '\t') {
        this.containerElement.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
      }
      else this.containerElement.innerHTML += data[index];

      setTimeout(() => {
        index++;
        this.#addText({ data, pauseMs }, doneCallback, index);
      }, Math.random() * (30) + this.speed);
    }
    else setTimeout(doneCallback, pauseMs);
  }
}
