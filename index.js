const express = require('express')
const app = express()
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const { log } = require('firebase-functions/logger');

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.post('/webhook', express.json(), function (req, res) {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
 
  function welcome(agent) {
    // console.log('default welcome intent');
    agent.add(`Hola bienvenido a CySe-Net, ¿Como puedo ayudarte?`);
  }
  
  function webhookPrueba(agent) {
    // console.log('webhook prueba');
    agent.add(`Hola desde el webhook`); 
  }

  function agendarMantenimientoCorreo(agent) {
    const horaMantenimiento = agent.parameters['horaMantenimiento']['date-time']['original'];
    const location = agent.parameters['horaMantenimiento']['location']['original'];
    console.log(`Mantenimiento agendado para: ${horaMantenimiento} en ${location}`);
    // const payloadJson = {
    //   "richContent": [
    //     [
    //       {
    //         "type": "description",
    //         "title": "Computacion y servicio",
    //         "text": [
    //           "Telefono: 4271090104",
    //           "Email: servicio@computacionyservicio.mx"
    //         ]
    //       }
    //     ]
    //   ]
    // };
    agent.add(`Webhook: Mantenimiento agendado para: ${horaMantenimiento} en ${location}`);
    // agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
  }
 
  // function fallback(agent) {
  //   agent.add(`I didn't understand`);
  //   agent.add(`I'm sorry, can you try again?`);
  // }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('webhookPrueba', webhookPrueba);
  intentMap.set('agendarMantenimientoCorreo', agendarMantenimientoCorreo);

  agent.handleRequest(intentMap);
  })

app.listen(3000,()=>{
    console.log('Server is running on port 3000: http://localhost:3000/');
})