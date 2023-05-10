import { init } from '../serverless.js';

export const handler = init({
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.98f5c67c.js","app":"_app/immutable/entry/app.a432ed75.js","imports":["_app/immutable/entry/start.98f5c67c.js","_app/immutable/chunks/index.f67675ac.js","_app/immutable/chunks/singletons.fe7528ed.js","_app/immutable/chunks/index.846c4acb.js","_app/immutable/entry/app.a432ed75.js","_app/immutable/chunks/preload-helper.41c905a7.js","_app/immutable/chunks/index.f67675ac.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('../server/nodes/0.js'),
			() => import('../server/nodes/1.js'),
			() => import('../server/nodes/2.js')
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
});
