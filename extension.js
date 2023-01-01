// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// Start apps on custom workspaces
/* exported init enable disable */

const {Shell} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;

class WindowMover {
    constructor() {
        this._settings = ExtensionUtils.getSettings();
        this._appSystem = Shell.AppSystem.get_default();
        this._appConfigs = new Map();
        this._appData = new Map();

        this._appsChangedId =
            this._appSystem.connect(
                'installed-changed',
                this._updateAppData.bind(this)
            );

        this._settings.connect('changed', this._updateAppConfigs.bind(this));
        this._updateAppConfigs();
    }

    _updateAppConfigs() {
        this._appConfigs.clear();

        this._settings.get_strv('application-list').forEach(v => {
            let [appId, num] = v.split(':');
            this._appConfigs.set(appId, parseInt(num) - 1);
        });

        this._updateAppData();
    }

    _updateAppData() {
        let ids = [...this._appConfigs.keys()];
        let removedApps = [...this._appData.keys()]
            .filter(a => !ids.includes(a.id));
        removedApps.forEach(app => {
            app.disconnect(this._appData.get(app).windowsChangedId);
            this._appData.delete(app);
        });

        let addedApps = ids
            .map(id => this._appSystem.lookup_app(id))
            .filter(app => app && !this._appData.has(app));
        addedApps.forEach(app => {
            let data = {
                windowsChangedId: app.connect('windows-changed',
                    this._appWindowsChanged.bind(this)),
                moveWindowsId: 0,
                windows: app.get_windows(),
            };
            this._appData.set(app, data);
        });
    }

    destroy() {
        if (this._appsChangedId) {
            this._appSystem.disconnect(this._appsChangedId);
            this._appsChangedId = 0;
        }

        if (this._settings) {
            this._settings.run_dispose();
            this._settings = null;
        }

        this._appConfigs.clear();
        this._updateAppData();
    }

    _moveWindow(window, workspaceNum) {
        if (window.skip_taskbar || window.is_on_all_workspaces())
            return;

        // ensure we have the required number of workspaces
        let workspaceManager = global.workspace_manager;
        for (let i = workspaceManager.n_workspaces; i <= workspaceNum; i++) {
            window.change_workspace_by_index(i - 1, false);
            workspaceManager.append_new_workspace(false, 0);
        }

        window.change_workspace_by_index(workspaceNum, false);
    }

    /**
     * When an apps window count occurs:
     * 1. Check If there are windows in a workspace
     * 2. Create an empty workspace next to current workspace and open newly opened window there
     **/
    _appWindowsChanged(app) {
        let data = this._appData.get(app);
        let windows = app.get_windows();

        windows.push(...data.windows.filter(w => {
            return !windows.includes(w) && w.get_compositor_private() !== null;
        }));

        let workspaceManager = global.workspace_manager;
        let workspaceNum = workspaceManager.n_workspaces + 1;
        windows.filter(w => !data.windows.includes(w)).forEach(window => {
            this._moveWindow(window, workspaceNum);
        });
        data.windows = windows;
    }
}

let winMover;

function init() {
    ExtensionUtils.initTranslations();
}

function enable() {
    winMover = new WindowMover();
}

function disable() {
    winMover.destroy();
}
