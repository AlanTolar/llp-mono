export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.6bcb8b80.js","app":"_app/immutable/entry/app.8af1b606.js","imports":["_app/immutable/entry/start.6bcb8b80.js","_app/immutable/chunks/index.afba99c9.js","_app/immutable/chunks/singletons.86352e27.js","_app/immutable/chunks/index.d0e42797.js","_app/immutable/entry/app.8af1b606.js","_app/immutable/chunks/preload-helper.41c905a7.js","_app/immutable/chunks/index.afba99c9.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js')
		],
		routes: [
			{
				id: "/(browse)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
