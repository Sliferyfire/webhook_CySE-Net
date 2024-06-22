const express = require('express')
const app = express()
const {WebhookClient} = require('dialogflow-fulfillment');

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.post('weebhook', express.json, function (req, res) {
  const agent = new WebhookClient({ request:req, response:res });
  console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
 
  function welcome(agent) {
    agent.add(`Hola bienvenido a CySe-Net, ¿Como puedo ayudarte?`);
  }
  function webhookPrueba(agent) {
    agent.add(`Hola desde el webhook`);
  }
 
  // function fallback(agent) {
  //   agent.add(`I didn't understand`);
  //   agent.add(`I'm sorry, can you try again?`);
  // }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('webhookPrueba', webhookPrueba);
  // intentMap.set('Default Fallback Intent', fallback);

  agent.handleRequest(intentMap);
  })

app.listen(3000,()=>{
    console.log('Server is running on port 3000: http://localhost:3000/');
})