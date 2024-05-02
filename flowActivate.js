const { execSync } = require("child_process");
const puppeteer = require("puppeteer");

const ACTIVATE = "Activate";
const DEACTIVATE = "Deactivate";
const FLAGS_REQUIRED =
  "The DeveloperName of the flow, as well as `Activate` or `Deactivate` must be passed as a command line argument.";
const INVALID_MODE = "The second argument must be `Activate` or `Deactivate`";
const TOO_MANY_ARGS = "There should be exactly two command line arguments";
const NO_FLOW_FOUND = "No flow found with that DeveloperName";
const DOUBLE_SLASH = "//";
const JS_PATH_FOR_TOGGLE_BUTTON = "#toggleFlowStatusButton-22 > button";
const FLOW_AFTER_BUTTON_PRESS_IMAGE = "afterButtonClick.png";
const FLOW_ALREADY_IN_STATE =
  "The flow is already in the requested state - no modifications will be made";
const FLOW_BEFORE_BUTTON_PRESS_IMAGE = "beforeButtonClick.png";
const NAVIGATE_TO_LOGIN = "Navigating to login URL";
const NAVIGATE_TO_FLOW = "Navigating to flow page";
const SLASH = "/";
const WINDOW_SIZE = `--window-size=1920,1080`;
const PUPPETEER_OPTIONS = {
  args: [WINDOW_SIZE],
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
};

// Validate the command-line arguments
function validateArguments(myArgs) {
  if (myArgs.length == 0 || myArgs.length == 1) {
    throw new Error(FLAGS_REQUIRED);
  }
  if (myArgs[1] != ACTIVATE && myArgs[1] != DEACTIVATE) {
    throw new Error(INVALID_MODE);
  }
  if (myArgs.length > 2) {
    throw new Error(TOO_MANY_ARGS);
  }
}

// Retrieve the login URL for the Salesforce org
function getLoginUrl() {
  const OPEN_ORG = "sfdx force:org:display --verbose --json";
  const FRONT_DOOR = "/secur/frontdoor.jsp?sid=";
  const stdout = execSync(OPEN_ORG).toString();
  const outputObject = JSON.parse(stdout);
  return (
    outputObject.result.instanceUrl +
    FRONT_DOOR +
    outputObject.result.accessToken
  );
}

// Construct the SOQL query to retrieve the latest version ID of the Flow
function getFlowQuery(flowDeveloperName) {
  return `sfdx force:data:soql:query --query "SELECT LatestVersion.Id FROM FlowDefinition WHERE DeveloperName = '${flowDeveloperName}'" --usetoolingapi --json`;
}

// Retrieve the latest version ID of the Flow
function getFlowId(flowDeveloperName) {
  let response = undefined;
  const stdout = execSync(getFlowQuery(flowDeveloperName)).toString();
  const outputObject = JSON.parse(stdout);
  if (
    outputObject &&
    outputObject.result &&
    outputObject.result.records &&
    outputObject.result.records.length > 0
  ) {
    response = outputObject.result.records[0].LatestVersion.Id;
  }
  if (response == undefined) {
    throw new Error(NO_FLOW_FOUND);
  }
  return response;
}

// Construct the Flow Builder URL based on the Flow ID
function getFlowBuilderUrl(flowId) {
  return `/builder_platform_interaction/flowBuilder.app?flowId=${flowId}`;
}

// Generate messages for logging the script's actions
function getClickButtonMessage(action) {
  return `Clicking "${action}" button`;
}

function getSuccessMessage(flowDeveloperName, action) {
  return `Successfully ${action}d the ${flowDeveloperName} flow`;
}

// Set the status of the Flow (activate or deactivate)
async function setFlowStatus(flowDeveloperName, action) {
  console.log(NAVIGATE_TO_LOGIN);
  console.log(getLoginUrl);
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();
  await page.goto(getLoginUrl());

  const pageUrl = await page.url();
  const pathArray = pageUrl.split(SLASH);
  const baseUrl = pathArray[0] + DOUBLE_SLASH + pathArray[2];
  const flowUrl = baseUrl + getFlowBuilderUrl(getFlowId(flowDeveloperName));

  console.log(NAVIGATE_TO_FLOW);
  console.log(getFlowBuilderUrl);
  await page.goto(flowUrl);
  await new Promise(resolve => setTimeout(resolve, 12000));

  const element = await page.waitForSelector(JS_PATH_FOR_TOGGLE_BUTTON);
  const currentButtonText = await element.evaluate((el) => el.textContent);

  if (currentButtonText != action) {
    console.log(FLOW_ALREADY_IN_STATE);
  } else {
    await page.screenshot({ path: FLOW_BEFORE_BUTTON_PRESS_IMAGE });
    console.log(getClickButtonMessage(action));
    await page.click(JS_PATH_FOR_TOGGLE_BUTTON);
    await new Promise(resolve => setTimeout(resolve, 6000));
    await page.screenshot({ path: FLOW_AFTER_BUTTON_PRESS_IMAGE });
    console.log(getSuccessMessage(flowDeveloperName, action));
  }
  await browser.close();
}

// Main function that handles the script execution
function main() {
  const myArgs = process.argv.slice(2);
  validateArguments(myArgs);
  setFlowStatus(myArgs[0], myArgs[1]);
}

main();
