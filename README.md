# Automate Activating Flows Post-Deployment using Puppeteer

Deploying new versions of Flows often requires Admins/Developers to manually click through the Setup menu, locate the Flow, and activate the new version. This can be cubersome or is often a step that is missed.

# Overview
This script is largely borrowed from https://www.mitchspano.com/blog/automate_your_post_deployment_steps_using_puppeteer. The blog covers the script in much more detail but its overview is simply:

> There are three main tools we need to perform this automation:
>
> - node.js  
> - sfdx CLI  
> - Puppeteer  
> 
> The automation for activating or deactivating a flow has a few steps:
> 
> - Validate Command-Line Arguments  
> - Fetch Salesforce Credentials and Construct a Login URL  
> - Fetch the Id of the Specified Flow  
> - Navigate to the Specified Flow and Activate/Deactivate  

# Running the script

To run the script, I typically first add it to the scripts folder in a SFDX project. From there, with the Project open, run the following commands in the terminal

`cd scripts`

`node flowActivate.js {{YourFlowsAPINameGoesHere}} Activate`

And you're done!
