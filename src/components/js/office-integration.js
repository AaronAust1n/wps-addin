// src/components/js/office-integration.js

// Ensure Office.js is loaded before using Office APIs
// Office.onReady() is the modern way, but for functions exposed globally for the manifest,
// they need to be available immediately. We'll wrap specific Office calls in onReady checks
// or assume Office is ready if these global functions are invoked by Office.

// --- Ribbon Action Handlers ---
// These functions will be called by the buttons defined in manifest-office.xml

async function handleContinueTextAction(event) {
  console.log("handleContinueTextAction called");
  try {
    const selectedText = await OfficeAppApi.getSelectedText();
    if (selectedText && selectedText.trim() !== "") {
      OfficeAppApi.alert(`Selected text: '${selectedText}'`, "Continue Text");
    } else {
      OfficeAppApi.alert("No text selected or selection is empty.", "Continue Text");
    }
  } catch (error) {
    console.error("Error in handleContinueTextAction:", error);
    OfficeAppApi.alert(`Error: ${error.message || error}`, "Error");
  } finally {
    if (event) {
      event.completed(); // Required for Office Add-ins to signal completion
    }
  }
}

function handleProofreadTextAction(event) {
  console.log("handleProofreadTextAction called");
  // TODO: Implement
  if (event) {
    event.completed();
  }
}

function handlePolishTextAction(event) {
  console.log("handlePolishTextAction called");
  // TODO: Implement
  if (event) {
    event.completed();
  }
}

function handleDocumentQAAction(event) {
  console.log("handleDocumentQAAction called");
  // TODO: Implement - likely involves showing a task pane with the QA interface
  // Office.context.ui.displayDialogAsync or Office.ui.showTaskpane
  if (event) {
    event.completed();
  }
}

function handleSummarizeDocAction(event) {
  console.log("handleSummarizeDocAction called");
  // TODO: Implement - likely involves getting document content and showing results in a task pane
  if (event) {
    event.completed();
  }
}

function handleSettingsAction(event) {
  console.log("handleSettingsAction called");
  const settingsUrl = 'https://localhost:3000/index.html#/settings'; // Assuming hash routing
  const dialogOptions = { height: 60, width: 40, displayInIframe: true };

  Office.context.ui.displayDialogAsync(settingsUrl, dialogOptions, (asyncResult) => {
    if (asyncResult.status === Office.AsyncResultStatus.Failed) {
      console.error("Error opening settings dialog:", asyncResult.error.message);
      // Optionally, inform the user via an alert or a status bar message
      OfficeAppApi.alert(`Error opening settings: ${asyncResult.error.message}`, "Error");
    } else {
      const dialog = asyncResult.value;
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg) => {
        console.log("Message from settings dialog:", arg.message);
        // Handle messages from dialog, e.g., settings saved
        if (arg.message === "close" || arg.message === "settingsSaved") {
          dialog.close();
        }
      });
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg) => {
        // Handle dialog lifecycle events (e.g., dialog closed by user)
        console.log("Settings dialog event:", arg.error); // 12006 is user closed
      });
    }
  });

  if (event) {
    event.completed();
  }
}

function handleHistoryAction(event) {
  console.log("handleHistoryAction called");
  // TODO: Implement - show a dialog or task pane for history
  if (event) {
    event.completed();
  }
}

function handleHelpAction(event) {
  console.log("handleHelpAction called");
  // TODO: Implement - show a dialog or task pane for help
  if (event) {
    event.completed();
  }
}

// --- Office API Abstraction Layer ---
// These functions will provide Office.js equivalents for WPS functionalities.

const OfficeAppApi = {
  isOfficeEnvironment: function() {
    return typeof Office !== 'undefined' && typeof Office.context !== 'undefined';
  },

  // Settings Storage
  getSetting: function(key, defaultValue = null) {
    if (!this.isOfficeEnvironment() || !Office.context.roamingSettings) {
      console.warn("Office environment or roamingSettings not available for getSetting.");
      return defaultValue;
    }
    let value = Office.context.roamingSettings.get(key);
    //RoamingSettings stores values as strings, numbers, or booleans directly.
    //Objects and arrays are typically stored as JSON strings.
    //For this basic version, we assume it's a simple type or caller handles parsing.
    return value === undefined || value === null ? defaultValue : value;
  },

  setSetting: function(key, value) {
    if (!this.isOfficeEnvironment() || !Office.context.roamingSettings) {
      console.warn("Office environment or roamingSettings not available for setSetting.");
      return;
    }
    Office.context.roamingSettings.set(key, value);
    Office.context.roamingSettings.saveAsync(function(asyncResult) {
      if (asyncResult.status === Office.AsyncResultStatus.Failed) {
        console.error('Failed to save setting: ' + key + '. Error: ' + asyncResult.error.message);
      } else {
        console.log('Setting saved: ' + key);
      }
    });
  },

  // Document Interaction
  getSelectedText: async function() {
    if (!this.isOfficeEnvironment()) {
      console.warn("getSelectedText: Office environment not available.");
      return Promise.reject(new Error("Office environment not available."));
    }
    return new Promise((resolve, reject) => {
      Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error('Error getting selected text:', asyncResult.error.message);
          reject(asyncResult.error);
        } else {
          resolve(asyncResult.value);
        }
      });
    });
  },

  // Placeholder for getCurrentParagraph - this is complex and host-specific
  getCurrentParagraph: async function() {
    if (!this.isOfficeEnvironment()) return null;
    console.warn("getCurrentParagraph is not fully implemented for Office yet.");
    // For Word:
    // return Word.run(async (context) => {
    //   const paragraph = context.document.getSelection().paragraphs.getFirst();
    //   paragraph.load('text');
    //   await context.sync();
    //   return paragraph.text;
    // }).catch(error => { console.error(error); return null; });
    return null; // Placeholder
  },

  getDocumentText: async function() {
    if (!this.isOfficeEnvironment()) return null;
    // This is a simplified version. For Word, might need WordApi.
    // Office.context.document.getFileAsync(Office.FileType.Text) is another option for some hosts.
    console.warn("getDocumentText is a simplified placeholder.");
    return "Document text (placeholder - full implementation needed)";
  },

  insertTextAtCursor: async function(text) {
    if (!this.isOfficeEnvironment()) {
      console.warn("insertTextAtCursor: Office environment not available.");
      return Promise.reject(new Error("Office environment not available."));
    }
    return new Promise((resolve, reject) => {
      Office.context.document.setSelectedDataAsync(text, { coercionType: Office.CoercionType.Text }, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error('Error inserting text:', asyncResult.error.message);
          reject(asyncResult.error);
        } else {
          resolve(true); // Successfully inserted/replaced selection
        }
      });
    });
  },
  
  replaceSelectedText: async function(text) {
    // Same as insertTextAtCursor for basic text insertion, as setSelectedDataAsync replaces selection.
    return this.insertTextAtCursor(text);
  },

  // UI Management
  showTaskpane: async function(url, title) {
    if (!this.isOfficeEnvironment()) return;
    // Office.ui.showTaskpane is not a direct API. Taskpanes are typically declared in manifest
    // or specific ones shown via commands. This function might be more about navigating an existing taskpane
    // or using displayDialogAsync as a modal taskpane.
    console.warn("showTaskpane needs specific implementation based on how taskpanes are managed.");
    // If using a single taskpane and just changing its content via routing:
    // window.location.href = url; // If functionFile and taskpane share same domain.
    // Or, more robustly, message the taskpane to navigate.
    // For now, let's assume it might open a dialog as a substitute if a dedicated taskpane isn't shown via manifest.
    return this.showDialog(url, { height: 60, width: 40, title: title });
  },

  showDialog: async function(url, options = {height: 50, width: 30, title: 'Dialog'}) {
    if (!this.isOfficeEnvironment()) return;
    return new Promise((resolve, reject) => {
      Office.context.ui.displayDialogAsync(url, options, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error(`Error showing dialog ${options.title}:`, asyncResult.error.message);
          reject(asyncResult.error);
        } else {
          const dialog = asyncResult.value;
          dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg) => {
            console.log('Message from dialog:', arg.message);
            // Potentially close dialog or handle other messages
            // dialog.close();
          });
          dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg) => {
            console.log('Dialog event:', arg.error); // 12006 typically means user closed
            resolve({ dialog, eventArgs: arg }); // Resolve when event occurs (e.g., closed)
          });
          // Resolve immediately if just launching is success, or handle via events.
          // For now, let's consider launching it a success for the promise.
          // resolve(dialog); // If you need to return the dialog object immediately.
        }
      });
    });
  },

  closeDialog: function(dialog) {
    // This function would be more complex; it implies `dialog` is an Office.Dialog object.
    // Typically, the dialog itself calls `messageParent` or is closed by user interaction.
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    } else {
      console.warn("closeDialog called with invalid dialog object or in wrong context.");
    }
  },
  
  alert: function(message, title = 'Alert') {
    if (!this.isOfficeEnvironment()) {
      console.warn("Alert: Office environment not available. Using window.alert.");
      window.alert(message);
      return;
    }
    // Construct a simple HTML page as a data URI for the dialog content.
    // Ensure message is properly escaped to prevent XSS if it contains HTML/script-like chars.
    const escapedMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const dialogHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Segoe UI, Frutiger, Frutiger Linotype, Dejavu Sans, Helvetica Neue, Arial, sans-serif; padding: 15px; font-size: 14px; }
            p { margin-top: 0; margin-bottom: 15px; }
            button { 
              padding: 8px 15px; 
              border: 1px solid #0078D4; 
              background-color: #0078D4; 
              color: white; 
              cursor: pointer; 
              float: right;
            }
            button:hover { background-color: #005A9E; }
          </style>
        </head>
        <body>
          <p>${escapedMessage}</p>
          <button onclick="Office.context.ui.messageParent('closeDialog');">OK</button>
        </body>
      </html>`;
    const dataUri = "data:text/html;charset=UTF-8," + encodeURIComponent(dialogHtml);
    
    const dialogOptions = { height: 25, width: 35, displayInIframe: true };

    Office.context.ui.displayDialogAsync(dataUri, dialogOptions, (asyncResult) => {
      if (asyncResult.status === Office.AsyncResultStatus.Failed) {
        console.error(`Error showing alert dialog "${title}":`, asyncResult.error.message);
        // Fallback for critical alerts if dialog fails
        window.alert(`${title}: ${message}`);
      } else {
        const dialog = asyncResult.value;
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg) => {
          if (arg.message === 'closeDialog') {
            dialog.close();
          }
        });
        dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg) => {
          // Handle dialog lifecycle events (e.g., dialog closed by user)
          console.log(`Alert dialog "${title}" event:`, arg.error); // 12006 is user closed
        });
      }
    });
  }
};

// Make functions accessible for ribbon commands (global scope or specific registration)
// For Office Add-ins, functions called by ribbon buttons must be in the global scope of the FunctionFile.
// If using a bundler, ensure these are exposed.
window.handleContinueTextAction = handleContinueTextAction;
window.handleProofreadTextAction = handleProofreadTextAction;
window.handlePolishTextAction = handlePolishTextAction;
window.handleDocumentQAAction = handleDocumentQAAction;
window.handleSummarizeDocAction = handleSummarizeDocAction;
window.handleSettingsAction = handleSettingsAction;
window.handleHistoryAction = handleHistoryAction;
window.handleHelpAction = handleHelpAction;

// Expose the OfficeAppApi for use by other modules if needed
window.OfficeAppApi = OfficeAppApi;

// It's good practice to call Office.onReady() to ensure Office.js is loaded
// and the host environment is ready. However, for manifest-defined ExecuteFunction,
// the functions must be globally available when the FunctionFile is loaded.
// Specific Office API calls within these functions should ideally check Office.onReady
// or be wrapped in it if they are not directly part of an event handler sequence.

Office.onReady((info) => {
  console.log(`Office is ready in ${info.host} ${info.platform}`);
  // You can do initializations here that require Office to be ready
  // For example, registering event handlers if not done by manifest
});

export default OfficeAppApi; // Export for potential module usage elsewhere
