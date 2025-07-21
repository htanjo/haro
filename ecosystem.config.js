const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  apps: [
    {
      name: "haro",
      script: "server-dist/index.js",
    },
  ],
  deploy: {
    production: {
      user: process.env.PROD_USER,
      host: process.env.PROD_HOST,
      ref: "origin/master", // Necessary even if you don't use Git. Stub value.
      repo: "", // Necessary for PM2 deploy, but we won't use Git deployment.
      path: process.env.PROD_PATH,
      ssh_options: ["StrictHostKeyChecking=no"],
      copy: true, // Copy files from local to remote server.
      "pre-deploy-local": "npm install && npm run build",
      "post-deploy": "pm2 restart ecosystem.config.js --env production",
    },
  },
};
