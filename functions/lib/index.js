"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshDownloadUrls = exports.onRoutineUpdate = exports.onEventUpdate = exports.onEventCreate = exports.leaveWorkspace = exports.generateInviteCode = exports.deleteEvent = exports.updateFcmToken = exports.updateRoutine = exports.joinWorkspace = exports.createWorkspace = exports.onUserCreate = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize the Firebase Admin SDK globally across functions
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Export Auth triggers
var onUserCreate_1 = require("./onUserCreate");
Object.defineProperty(exports, "onUserCreate", { enumerable: true, get: function () { return onUserCreate_1.onUserCreate; } });
// Export Callable actions
var createWorkspace_1 = require("./createWorkspace");
Object.defineProperty(exports, "createWorkspace", { enumerable: true, get: function () { return createWorkspace_1.createWorkspace; } });
var joinWorkspace_1 = require("./joinWorkspace");
Object.defineProperty(exports, "joinWorkspace", { enumerable: true, get: function () { return joinWorkspace_1.joinWorkspace; } });
var updateRoutine_1 = require("./updateRoutine");
Object.defineProperty(exports, "updateRoutine", { enumerable: true, get: function () { return updateRoutine_1.updateRoutine; } });
var updateFcmToken_1 = require("./updateFcmToken");
Object.defineProperty(exports, "updateFcmToken", { enumerable: true, get: function () { return updateFcmToken_1.updateFcmToken; } });
var deleteEvent_1 = require("./deleteEvent");
Object.defineProperty(exports, "deleteEvent", { enumerable: true, get: function () { return deleteEvent_1.deleteEvent; } });
var generateInviteCode_1 = require("./generateInviteCode");
Object.defineProperty(exports, "generateInviteCode", { enumerable: true, get: function () { return generateInviteCode_1.generateInviteCode; } });
var leaveWorkspace_1 = require("./leaveWorkspace");
Object.defineProperty(exports, "leaveWorkspace", { enumerable: true, get: function () { return leaveWorkspace_1.leaveWorkspace; } });
// Export Firestore document triggers
var onEventCreate_1 = require("./onEventCreate");
Object.defineProperty(exports, "onEventCreate", { enumerable: true, get: function () { return onEventCreate_1.onEventCreate; } });
var onEventUpdate_1 = require("./onEventUpdate");
Object.defineProperty(exports, "onEventUpdate", { enumerable: true, get: function () { return onEventUpdate_1.onEventUpdate; } });
var onRoutineUpdate_1 = require("./onRoutineUpdate");
Object.defineProperty(exports, "onRoutineUpdate", { enumerable: true, get: function () { return onRoutineUpdate_1.onRoutineUpdate; } });
// Export Scheduled jobs
var refreshDownloadUrls_1 = require("./refreshDownloadUrls");
Object.defineProperty(exports, "refreshDownloadUrls", { enumerable: true, get: function () { return refreshDownloadUrls_1.refreshDownloadUrls; } });
//# sourceMappingURL=index.js.map