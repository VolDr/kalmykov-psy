// PM2 Configuration for production deployment
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
	apps: [
		{
			name: 'kalmykov-psy-web',
			script: 'build/index.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'production',
				PORT: 3000
			}
		},
		{
			name: 'kalmykov-psy-ws',
			script: 'npx',
			args: 'tsx server/websocket.ts',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '512M',
			env: {
				NODE_ENV: 'production',
				WS_PORT: 3001
			}
		}
	]
};
