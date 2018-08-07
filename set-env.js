const { writeFile } = require('fs');

const targetPath = './ui/src/config/config.js';

const envConfigFile = `
const config = {
  API_URL: '${process.env.API_URL || 'http://local.topcoder-dev.com:3000'}/api/v1',
  TC_AUTH_URL: '${process.env.TC_AUTH_URL || 'https://accounts.topcoder-dev.com'}',
  ACCOUNTS_APP_CONNECTOR: '${process.env.ACCOUNTS_APP_CONNECTOR || 'https://accounts.topcoder-dev.com/connector.html'}',
  APP_URL: '${process.env.APP_URL || 'http://local.topcoder-dev.com:3000'}',
  RESTHOOK_FILTER_MAX_LENGTH: ${process.env.RESTHOOK_FILTER_MAX_LENGTH || 1000}
};

export default config;

`;

writeFile(targetPath, envConfigFile, (err) => {
  if (err) {
    console.log('Error during environment variable generation');
    console.error(err);
  } else {
    console.log('Environment file generated successfully');
  }
});
