const dotenv = require("dotenv");
dotenv.config();

const user = process.env.PROD_USER;
const host = process.env.PROD_HOST;
const path = process.env.PROD_PATH;

module.exports = {
  apps: [
    {
      name: "haro",
      script: "server-dist/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
  deploy: {
    production: {
      user,
      host,
      ref: "origin/master", // Necessary even if you don't use Git. Stub value.
      repo: "git@github.com:htanjo/haro.git", // Necessary for PM2 deploy, but we won't use Git deployment.
      path,
      ssh_options: ["StrictHostKeyChecking=no"],
      "pre-deploy-local": `scp .env ${user}@${host}:${path}/shared/.env`,
      "post-deploy": [
        "ln -sf ../shared/.env .env",
        "npm install",
        "npm run build",
        "pm2 reload ecosystem.config.js --env production",
      ].join(" && "),
    },
  },
};
