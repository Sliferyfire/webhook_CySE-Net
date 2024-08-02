const express = require('express')
const app = express()
const functions = require('firebase-functions');
const {WebhookClient, Payload} = require('dialogflow-fulfillment');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
require('dotenv').config()

const email = process.env.EMAIL;
const pass = process.env.PASS;

async function buscarDireccion(direccion) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'webhook-CySeNet ' + email, 
      'Referer': 'https://computacionyservicio.mx/'
    }
  });

  if (response.ok) {
    const data = await response.json();
    if (data.length > 0) {
      return data[0]; // Devolver el primer resultado
    } else {
      throw new Error('Dirección no encontrada');
    }
  } else {
    const errorText = await response.text();
    throw new Error(`Error en la solicitud: ${errorText}`);
  }
}

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: email, 
    pass: pass 
  }
});

//-------------------------Rutas-------------------------

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.post('/webhook', express.json(), function (req, res) {
  console.log('webhook');
  const agent = new WebhookClient({ request: req, response: res });
  console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
 
  function welcome(agent) {
    agent.add(`Hola bienvenido a CySe-Net, ¿Como puedo ayudarte?`);
  }

  //-------------------------VALIDAR DIRECCION-------------------------

  function validarDireccion(agent) {
    const context = agent.context.get('infoCliente');
    const direccion = context.parameters['address'];
    direccion = direccion + ', San Juan del Rio, Queretaro';
    console.log('Dirección: ', direccion);

    buscarDireccion(direccion)
      .then((resultado) => {
        agent.add(`Gracias por proporcionar tu direccion.`);
        agent.add(`¿Ahora podrias decirme que dia te gustaria agendar tu mantenimiento?`);
      })
      .catch((error) => {
        agent.add(`Lo siento pero no pude encontrar tu dirección.`);
        agent.add(`Pudes intentar a ingresar nuevamente tu direccion, intenta escribir tambien el tipo de calle (calle, avenida, privada, etc).`);
        agent.add(`Recuerda que yo solo puedo atender en la ciudad de San Juan del Rio, Querétaro`);
        agent.add(`Si vives fuera de esta ciudad o tu direccion no es encontrada, te recomiendo hablar directamente con nuestro asesor.`);
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
        agent.setContext({
          name: 'nombreCliente',
          lifespan: 1,
          parameters: {}
        });

        agent.setContext({
          name: 'usuarioPreguntaMantenimiento-equipo-followup',
          lifespan: 1,
          parameters: {}
        });
      });
  }

  //-------------------------ENVIAR CORREO-------------------------

  async function agendarMantenimientoCorreo(agent) {
    const context = agent.context.get('horamantenimiento');
    const locationOriginal = context.parameters['location.original'];
    const dateTimeOriginal = context.parameters['date-time.original'][0];
    const tipoMantenimiento = context.parameters['tipoMantenimiento'];
    let mensaje = {
      from: email,
      to: email,
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

  //-------------------------INTENT MAP-------------------------

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('usuarioPreguntaMantenimiento - calle', validarDireccion);
  intentMap.set('agendarMantenimientoCorreo', agendarMantenimientoCorreo);

  agent.handleRequest(intentMap);
  })

app.listen(3000,()=>{
    console.log('Server is running on port 3000: http://localhost:3000/');

})











  

  // function webhookPrueba(agent) {
  //   agent.add(`Hola desde el webhook`); 
  //   const payloadJson = {
  //     "richContent": [
  //       [
  //         {
  //           "type": "carousel",
  //           "items": [
  //             {
  //               "info": {
  //                 "key": "item1",
  //                 "synonyms": [
  //                   "Item 1"
  //                 ]
  //               },
  //               "title": "Gato 1",
  //               "description": "Gato 1",
  //               "image": {
  //                 "src": {
  //                   "rawUrl": "https://st3.depositphotos.com/1594920/14721/i/1600/depositphotos_147217377-stock-photo-european-cat-sitting-isolated-on.jpg"
  //                 }
  //               }
  //             },
  //             {
  //               "info": {
  //                 "key": "item2",
  //                 "synonyms": [
  //                   "Item 2"
  //                 ]
  //               },
  //               "title": "Gato 2",
  //               "description": "Gato 2",
  //               "image": {
  //                 "src": {
  //                   "rawUrl": "https://cdn.pixabay.com/photo/2017/08/22/16/23/cat-2669554_1280.png"
  //                 }
  //               }
  //             }
  //           ]
  //         }
  //       ]
  //     ]
  //   };
  //   agent.add(new Payload(agent.UNSPECIFIED, payloadJson, { rawPayload: true, sendAsMessage: true }));
  // }