/**
 * Collections View UI Integration
 * 
 * This file provides UI button integration for the Collections sidebar.
 * The buttons are registered in package.json under viewsWelcome.
 * 
 * To add buttons to the Collections sidebar, add the following to package.json:
 * 
 * "viewsWelcome": [
 *   {
 *     "view": "reqbeam.collectionsView",
 *     "contents": "Welcome to ReqBeam Collections\n[Import Collection](command:reqbeam.collections.import)\n[Export Collection](command:reqbeam.collections.export)\n[Import Swagger](command:reqbeam.collections.importSwagger)"
 *   }
 * ]
 * 
 * Or use view/title actions in package.json menus section:
 * 
 * "menus": {
 *   "view/title": [
 *     {
 *       "command": "reqbeam.collections.import",
 *       "when": "view == reqbeam.collectionsView",
 *       "group": "navigation"
 *     },
 *     {
 *       "command": "reqbeam.collections.export",
 *       "when": "view == reqbeam.collectionsView",
 *       "group": "navigation"
 *     },
 *     {
 *       "command": "reqbeam.collections.importSwagger",
 *       "when": "view == reqbeam.collectionsView",
 *       "group": "navigation"
 *     }
 *   ]
 * }
 */

// This file serves as documentation for UI integration
// The actual UI buttons are configured in package.json

export const COLLECTIONS_VIEW_COMMANDS = {
  IMPORT: "reqbeam.collections.import",
  EXPORT: "reqbeam.collections.export",
  IMPORT_SWAGGER: "reqbeam.collections.importSwagger",
} as const;

