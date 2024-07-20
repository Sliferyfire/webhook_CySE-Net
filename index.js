const express = require('express')
const app = express()
const functions = require('firebase-functions');
const {WebhookClient, Payload} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const { log } = require('firebase-functions/logger');
const nodemailer = require('nodemailer');
require('dotenv').config()

const email = process.env.EMAIL;
const pass = process.env.PASS;

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: email, 
    pass: pass 
  }
});

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
    agent.add(`Hola desde el webhook`); 
    const payloadJson = {
      "richContent": [
        [
          {
            "type": "carousel",
            "items": [
              {
                "info": {
                  "key": "item1",
                  "synonyms": [
                    "Item 1"
                  ]
                },
                "title": "Gato 1",
                "description": "Gato 1",
                "image": {
                  "src": {
                    "rawUrl": "https://st3.depositphotos.com/1594920/14721/i/1600/depositphotos_147217377-stock-photo-european-cat-sitting-isolated-on.jpg"
                  }
                }
              },
              {
                "info": {
                  "key": "item2",
                  "synonyms": [
                    "Item 2"
                  ]
                },
                "title": "Gato 2",
                "description": "Gato 2",
                "image": {
                  "src": {
                    "rawUrl": "https://cdn.pixabay.com/photo/2017/08/22/16/23/cat-2669554_1280.png"
                  }
                }
              }
            ]
          }
        ]
      ]
    };
    agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
  }

  async function agendarMantenimientoCorreo(agent) {
    const context = agent.context.get('horamantenimiento');
    const locationOriginal = context.parameters['location.original'];
    const dateTimeOriginal = context.parameters['date-time.original'][0];
    const tipoMantenimiento = context.parameters['tipoMantenimiento'];
    // console.log(`Mantenimiento agendado para: ${dateTimeOriginal} en ${locationOriginal}`);
    let mensaje = {
      from: 'sliferyfire@gmail.com',
      to: 'sliferyfire@gmail.com',
      subject: 'Agenda de mantenimiento',
      text: 'Manetnimiento ' + tipoMantenimiento + ' en la fecha y hora: ' + dateTimeOriginal + ' en ' + locationOriginal,
    };
    const info = await transporter.sendMail(mensaje);
    console.log(info);

    agent.add(`Mantenimiento ${tipoMantenimiento} agendado para: ${dateTimeOriginal} en ${locationOriginal}`);
    agent.add(`Si necesita más ayuda, no dude en preguntar o comunicarse con un asesor.`);
    const payloadJson = {
      "richContent": [
        [
          {
            "type": "description",
            "title": "Computacion y servicio",
            "text": [
              "Telefono: 4271090104",
              "Email: servicio@computacionyservicio.mx"
            ]
          }
        ]
      ]
    };
    agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
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